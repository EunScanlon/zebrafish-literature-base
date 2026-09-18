import fs from "node:fs/promises";
import path from "node:path";

// Stop before any human/security challenge. CNKI uses several phrasings for
// the same slider puzzle, and some are rendered only in the modal overlay.
const CAPTCHA_MARKERS = [
  "拖动滑块",
  "拼图验证",
  "拖动下方拼图完成验证",
  "安全验证",
  "请输入验证码"
];

function captchaMarker(snapshot) {
  return CAPTCHA_MARKERS.find(marker => snapshot.includes(marker)) || null;
}

async function visibleCaptchaMarker(tab) {
  const markers = CAPTCHA_MARKERS;
  return tab.playwright.evaluate(markers => {
    const isVisible = element => {
      const rect = element.getBoundingClientRect();
      if (!(rect.width > 0
        && rect.height > 0
        && rect.bottom > 0
        && rect.right > 0
        && rect.top < innerHeight
        && rect.left < innerWidth)) return false;

      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.display === "none"
          || style.visibility === "hidden"
          || Number(style.opacity || 1) <= 0.01) return false;
      }
      return true;
    };

    for (const marker of markers) {
      const matching = Array.from(document.querySelectorAll("body *"))
        .filter(element => Array.from(element.childNodes).some(node =>
          node.nodeType === Node.TEXT_NODE && (node.textContent || "").includes(marker)
        ));
      if (matching.some(isVisible)) return marker;
    }
    return null;
  }, markers);
}

function pageInfo(snapshot) {
  const match = snapshot.match(/- text: (\d+)\/(\d+)/);
  return match
    ? { page: Number(match[1]), totalPages: Number(match[2]) }
    : { page: null, totalPages: null };
}

async function extractRows(tab) {
  return tab.playwright.evaluate(() =>
    Array.from(document.querySelectorAll("td.name a.fz14"))
      .map(anchor => {
        const row = anchor.closest("tr");
        const cells = row
          ? Array.from(row.querySelectorAll("td")).map(cell => cell.innerText.trim())
          : [];

        return {
          title: anchor.textContent.trim(),
          authors: cells[2] || "",
          source: cells[3] || "",
          year: (cells[4] || "").match(/(?:19|20)\d{2}/)?.[0] || "",
          database: cells[5] || "",
          resourceType: cells[5] || "",
          url: anchor.href
        };
      })
      .filter(record => record.title)
  );
}

async function readExisting(outPath) {
  const state = await readExistingState(outPath);
  return state.records;
}

async function readExistingState(outPath) {
  try {
    const parsed = JSON.parse(await fs.readFile(outPath, "utf8"));
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      completedPages: Number.isFinite(parsed.completedPages) ? parsed.completedPages : 0,
      totalPages: Number.isFinite(parsed.totalPages) ? parsed.totalPages : null,
      query: parsed.query || null,
      category: parsed.category || null
    };
  } catch {
    return { records: [], completedPages: 0, totalPages: null, query: null, category: null };
  }
}

export async function loadCollectorHelpers() {
  return {
    captchaMarker,
    visibleCaptchaMarker,
    pageInfo,
    extractRows,
    readExisting,
    readExistingState,
    writeProgress,
    waitForRows,
    setPageSize,
    advancePage,
    seekCnkiPage
  };
}

async function writeProgress(outPath, payload) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");
}

async function waitForRows(tab, expectedRows, attempts = 40) {
  let rows = [];
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    rows = await extractRows(tab);
    if (rows.length >= expectedRows) return rows;
    await tab.playwright.waitForTimeout(180);
  }
  return rows;
}

async function advanceWithTopPager(tab, currentPage) {
  try {
    // CNKI keeps its pager near the right edge of a wide results canvas. Put
    // that control into the physical viewport before using an input click.
    await tab.cua.scroll({ x: 220, y: 300, scrollX: 1400, scrollY: -12000 });
    await tab.playwright.waitForTimeout(180);

    const target = await tab.playwright.evaluate(() => {
      const element = document.querySelector("#Page_next_top");
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const visible = rect.width > 0
        && rect.height > 0
        && rect.left >= 0
        && rect.right <= innerWidth
        && rect.top >= 0
        && rect.bottom <= innerHeight
        && style.display !== "none"
        && style.visibility !== "hidden";
      return visible
        ? { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
        : null;
    });
    if (!target) return null;

    await tab.cua.click(target);
    for (let poll = 0; poll < 45; poll += 1) {
      await tab.playwright.waitForTimeout(140);
      const snapshot = await tab.playwright.domSnapshot();
      const marker = await visibleCaptchaMarker(tab);
      if (marker) return { ok: false, reason: "captcha", marker };
      const info = pageInfo(snapshot);
      if (info.page > currentPage && (await extractRows(tab)).length > 0) {
        return { ok: true, page: info.page };
      }
    }
  } catch {
    // The bottom-pager fallback below covers transient view changes.
  }
  return null;
}

/** Select the largest result-page size exposed by the visible CNKI control. */
async function setPageSize(tab, requested = 50) {
  const target = requested >= 50 ? "50" : String(requested);
  const currentLabel = tab.playwright.locator("#perPageDiv .sort-default span");
  if (!(await currentLabel.count()) || !(await currentLabel.isVisible())) {
    return { ok: false, reason: "page-size-control" };
  }
  if ((await currentLabel.innerText()).trim() === target) {
    return { ok: true, pageSize: Number(target), changed: false };
  }

  await currentLabel.click({ timeoutMs: 5000 });
  const option = tab.playwright
    .locator(`#perPageDiv .sort-list li[data-val="${target}"] a`)
    .filter({ visible: true });
  if (!(await option.count())) return { ok: false, reason: "page-size-option", pageSize: target };
  await option.click({ timeoutMs: 5000 });
  for (let poll = 0; poll < 50; poll += 1) {
    await tab.playwright.waitForTimeout(160);
    const snapshot = await tab.playwright.domSnapshot();
    if (await visibleCaptchaMarker(tab)) return { ok: false, reason: "captcha" };
    const info = pageInfo(snapshot);
    const rows = await extractRows(tab);
    if (info.page === 1 && rows.length > 0) {
      return { ok: true, pageSize: Number(target), changed: true, page: 1, totalPages: info.totalPages };
    }
  }
  return { ok: false, reason: "page-size-navigation" };
}

async function advancePage(tab, currentPage) {
  const topAdvance = await advanceWithTopPager(tab, currentPage);
  if (topAdvance) return topAdvance;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await tab.cua.scroll({ x: 400, y: 600, scrollX: 0, scrollY: 6000 });
    await tab.playwright.waitForTimeout(200);
    await tab.cua.scroll({ x: 400, y: 650, scrollX: 1400, scrollY: 0 });
    await tab.playwright.waitForTimeout(120);

    const visibleDom = JSON.stringify(await tab.dom_cua.get_visible_dom());
    const nextNode = visibleDom.match(/<a node_id=(\d+)[^>]*>下一页<\/a>/)?.[1];
    if (nextNode) {
      await tab.dom_cua.click({ node_id: nextNode });
    } else {
      try {
        await tab.playwright.getByRole("link", { name: "下一页" }).click({ timeoutMs: 5000 });
      } catch {
        // Poll before retrying: the click may have navigated despite timing out.
      }
    }

    for (let poll = 0; poll < 45; poll += 1) {
      await tab.playwright.waitForTimeout(180);
      const snapshot = await tab.playwright.domSnapshot();
      const marker = await visibleCaptchaMarker(tab);
      if (marker) return { ok: false, reason: "captcha", marker };

      const info = pageInfo(snapshot);
      if (info.page > currentPage && (await extractRows(tab)).length > 0) {
        return { ok: true, page: info.page };
      }
    }
  }

  return { ok: false, reason: "navigation" };
}

export async function seekCnkiPage(tab, targetPage) {
  while (true) {
    const snapshot = await tab.playwright.domSnapshot();
    const marker = await visibleCaptchaMarker(tab);
    const info = pageInfo(snapshot);

    if (marker) return { ok: false, reason: "captcha", page: info.page, marker };
    if (!info.page || !info.totalPages) return { ok: false, reason: "page-state", page: info.page };
    if (info.page >= targetPage) return { ok: info.page === targetPage, page: info.page };

    const topAdvance = await advanceWithTopPager(tab, info.page);
    if (topAdvance?.reason === "captcha") {
      return { ok: false, reason: "captcha", page: info.page, marker: topAdvance.marker };
    }
    if (topAdvance?.ok) continue;

    await tab.cua.scroll({ x: 400, y: 600, scrollX: 0, scrollY: 6000 });
    await tab.playwright.waitForTimeout(180);
    await tab.cua.scroll({ x: 400, y: 650, scrollX: 1400, scrollY: 0 });
    await tab.playwright.waitForTimeout(120);
    const visibleDom = JSON.stringify(await tab.dom_cua.get_visible_dom());
    const candidates = Array.from(
      visibleDom.matchAll(/<a node_id=(\d+)[^>]*>(\d+)<\/a>/g),
      match => ({ nodeId: match[1], page: Number(match[2]) })
    )
      .filter(item => item.page > info.page && item.page <= targetPage)
      .sort((a, b) => b.page - a.page);
    const nextNode = candidates[0]?.nodeId
      || visibleDom.match(/<a node_id=(\d+)[^>]*>下一页<\/a>/)?.[1];

    if (!nextNode) return { ok: false, reason: "page-link", page: info.page };
    await tab.dom_cua.click({ node_id: nextNode });

    let advanced = false;
    for (let poll = 0; poll < 45; poll += 1) {
      await tab.playwright.waitForTimeout(180);
      const nextSnapshot = await tab.playwright.domSnapshot();
      const nextMarker = await visibleCaptchaMarker(tab);
      if (nextMarker) return { ok: false, reason: "captcha", page: info.page, marker: nextMarker };
      const nextInfo = pageInfo(nextSnapshot);
      if (nextInfo.page > info.page && (await extractRows(tab)).length > 0) {
        advanced = true;
        break;
      }
    }
    if (!advanced) return { ok: false, reason: "navigation", page: info.page };
  }
}

export async function collectCnkiCategory({
  tab,
  query = "斑马鱼",
  category,
  language = "中文",
  resourceType = category,
  yearBucket = "",
  outPath,
  expectedTotalRecords,
  pageSize = 20,
  stopPage = Number.POSITIVE_INFINITY,
  saveEvery = 10,
  configurePageSize = false,
  resumeFromPage = null
}) {
  const existingState = await readExistingState(outPath);
  if (configurePageSize) {
    const configured = await setPageSize(tab, pageSize);
    if (!configured.ok) {
      return {
        category,
        startPage: null,
        endPage: null,
        unique: existingState.records.length,
        stopped: configured,
        shortPages: []
      };
    }
    pageSize = configured.pageSize;
  }
  const existing = existingState.records;
  const records = new Map(
    existing.map(record => [record.url || `${record.title}|${record.year}`, record])
  );
  const progress = [];
  let stopped = null;
  let completedPages = existingState.completedPages || 0;

  if (Number.isFinite(resumeFromPage)) {
    const snapshot = await tab.playwright.domSnapshot();
    const current = pageInfo(snapshot);
    if (current.page && current.page < resumeFromPage) {
      const jumped = await seekCnkiPage(tab, resumeFromPage);
      if (!jumped.ok) {
        stopped = {
          reason: jumped.reason,
          page: jumped.page || current.page,
          marker: jumped.marker || null
        };
        await writeProgress(outPath, {
          query,
          category,
          collectedAt: new Date().toISOString(),
          completedPages,
          totalPages: jumped.totalPages || existingState.totalPages || current.totalPages,
          stopped,
          records: Array.from(records.values())
        });
        return {
          category,
          startPage: null,
          endPage: null,
          unique: records.size,
          stopped,
          shortPages: []
        };
      }
    }
  }

  while (true) {
    const snapshot = await tab.playwright.domSnapshot();
    const marker = await visibleCaptchaMarker(tab);
    const info = pageInfo(snapshot);

    if (marker) {
      stopped = { reason: "captcha", page: info.page, marker };
      break;
    }
    if (!info.page || !info.totalPages) {
      stopped = { reason: "page-state", page: info.page };
      break;
    }

    const remaining = Number.isFinite(expectedTotalRecords)
      ? Math.max(0, expectedTotalRecords - (info.page - 1) * pageSize)
      : pageSize;
    const expectedRows = Math.min(pageSize, remaining || pageSize);
    const rows = await waitForRows(tab, expectedRows);

    for (const row of rows) {
      records.set(row.url || `${row.title}|${row.year}`, {
        ...row,
        category,
        language,
        resourceType,
        yearBucket,
        page: info.page
      });
    }

    progress.push({ page: info.page, count: rows.length, unique: records.size });
    completedPages = Math.max(completedPages, info.page);

    const done = info.page >= info.totalPages || info.page >= stopPage;
    if (info.page % saveEvery === 0 || done) {
      await writeProgress(outPath, {
        query,
        category,
        collectedAt: new Date().toISOString(),
        completedPages,
        totalPages: info.totalPages,
        stopped,
        records: Array.from(records.values())
      });
    }
    if (done) break;

    const advanced = await advancePage(tab, info.page);
    if (!advanced.ok) {
      stopped = { reason: advanced.reason, page: info.page, marker: advanced.marker || null };
      break;
    }
  }

  await writeProgress(outPath, {
    query,
    category,
    collectedAt: new Date().toISOString(),
    completedPages: completedPages || null,
    totalPages: pageInfo(await tab.playwright.domSnapshot()).totalPages,
    stopped,
    records: Array.from(records.values())
  });

  return {
    category,
    startPage: progress[0]?.page || null,
    endPage: progress.at(-1)?.page || null,
    unique: records.size,
    stopped,
    shortPages: progress.filter(item => item.count < pageSize)
  };
}
