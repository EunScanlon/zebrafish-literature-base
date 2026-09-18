import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const input = path.resolve(args[0] && !args[0].startsWith("--") ? args[0] : "data/raw");
const outIndex = args.indexOf("--out");
const output = path.resolve(outIndex >= 0 ? args[outIndex + 1] : "data/translations-en-zh.json");
const limitIndex = args.indexOf("--limit");
const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : Number.POSITIVE_INFINITY;
const concurrencyIndex = args.indexOf("--concurrency");
const concurrency = Math.max(1, Math.min(8, concurrencyIndex >= 0 ? Number(args[concurrencyIndex + 1]) : 4));
const delayIndex = args.indexOf("--delay");
const delayMs = delayIndex >= 0 ? Number(args[delayIndex + 1]) : 250;
const maxBatchChars = 4_000;
const maxBatchItems = 30;
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36";

function isEnglishTitle(title) {
  return title && !/[\u3400-\u9fff]/u.test(title) && /[a-z]/i.test(title);
}

async function listJsonFiles(target) {
  const stat = await fs.stat(target);
  if (stat.isFile()) return path.extname(target).toLowerCase() === ".json" ? [target] : [];
  const entries = await fs.readdir(target, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => listJsonFiles(path.join(target, entry.name))));
  return files.flat();
}

async function readTitles() {
  const titles = new Set();
  for (const file of await listJsonFiles(input)) {
    const payload = JSON.parse(await fs.readFile(file, "utf8"));
    const records = Array.isArray(payload) ? payload : payload.records || payload.papers || [];
    for (const record of records) {
      const title = String(record?.title || "").replace(/\s+/g, " ").trim();
      const explicitLanguage = String(record?.language || record?.lang || "").toLowerCase();
      if ((isEnglishTitle(title) || /英文|英语|english|foreign/.test(explicitLanguage)) && !record.titleZh) titles.add(title);
    }
  }
  return [...titles];
}

async function readCache() {
  try {
    const payload = JSON.parse(await fs.readFile(output, "utf8"));
    return payload.translations || payload;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function writeCache(translations) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify({ updatedAt: new Date().toISOString(), provider: "Bing Translator", translations }, null, 2), "utf8");
  await fs.rename(temporary, output);
}

function buildBatches(titles) {
  const batches = [];
  let batch = [];
  let chars = 0;
  for (const title of titles) {
    const size = title.length + 12;
    if (batch.length && (batch.length >= maxBatchItems || chars + size > maxBatchChars)) {
      batches.push(batch);
      batch = [];
      chars = 0;
    }
    batch.push(title);
    chars += size;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

async function createBingSession() {
  const response = await fetch("https://www.bing.com/translator", { headers: { "User-Agent": userAgent } });
  const html = await response.text();
  const ig = html.match(/IG:\"([^\"]+)/)?.[1];
  const helper = html.match(/params_AbusePreventionHelper\s*=\s*\[([^\]]+)/)?.[1]?.split(",");
  const iid = html.match(/data-iid=\"([^\"]+)/)?.[1];
  if (!response.ok || !ig || !helper || !iid) throw new Error("Could not initialize Bing Translator session");
  return {
    base: new URL(response.url).origin,
    referer: response.url,
    cookies: response.headers.getSetCookie().map(value => value.split(";", 1)[0]).join("; "),
    ig,
    iid,
    key: helper[0],
    token: helper[1].replaceAll('"', ""),
    sequence: 1
  };
}

function parseBatchTranslation(text, titles) {
  const found = new Map();
  for (const match of text.matchAll(/\[ZF(\d{4})\]\s*([\s\S]*?)(?=\n?\[ZF\d{4}\]|$)/g)) {
    found.set(Number(match[1]), match[2].replace(/\s+/g, " ").trim());
  }
  if (found.size !== titles.length) throw new Error(`Translation markers mismatch: ${found.size}/${titles.length}`);
  return titles.map((title, index) => ({ title, titleZh: found.get(index + 1) }));
}

async function requestBatch(session, titles) {
  const text = titles.map((title, index) => `[ZF${String(index + 1).padStart(4, "0")}] ${title}`).join("\n");
  const body = new URLSearchParams({
    fromLang: "en",
    to: "zh-Hans",
    tone: "Casual",
    text,
    token: session.token,
    key: session.key
  });
  const url = `${session.base}/ttranslatev3?isVertical=1&&IG=${session.ig}&IID=${session.iid}&SFX=${session.sequence++}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: session.cookies,
      Referer: session.referer,
      "User-Agent": userAgent
    },
    body
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Bing HTTP ${response.status}: ${raw.slice(0, 160)}`);
  const payload = JSON.parse(raw);
  const translated = payload?.[0]?.translations?.[0]?.text;
  if (!translated) throw new Error("Bing returned no translated text");
  return parseBatchTranslation(translated, titles);
}

async function translateWithRetry(sessionRef, titles, attempts = 3) {
  let error;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await requestBatch(sessionRef.current, titles);
    } catch (currentError) {
      error = currentError;
      if (/HTTP 401|HTTP 403|initialize/i.test(currentError.message)) sessionRef.current = await createBingSession();
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 750));
    }
  }
  if (titles.length > 1) {
    const middle = Math.ceil(titles.length / 2);
    return [
      ...await translateWithRetry(sessionRef, titles.slice(0, middle), attempts),
      ...await translateWithRetry(sessionRef, titles.slice(middle), attempts)
    ];
  }
  if (titles[0].length > maxBatchChars - 100) {
    const original = titles[0];
    const parts = [];
    let remaining = original;
    while (remaining.length) {
      if (remaining.length <= maxBatchChars - 100) {
        parts.push(remaining);
        break;
      }
      const window = remaining.slice(0, maxBatchChars - 100);
      const boundary = Math.max(window.lastIndexOf(". "), window.lastIndexOf("; "), window.lastIndexOf(" "));
      const splitAt = boundary > 1_000 ? boundary + 1 : window.length;
      parts.push(remaining.slice(0, splitAt).trim());
      remaining = remaining.slice(splitAt).trim();
    }
    const translatedParts = [];
    for (const part of parts) {
      const [translated] = await translateWithRetry(sessionRef, [part], attempts);
      translatedParts.push(translated.titleZh);
    }
    return [{ title: original, titleZh: translatedParts.join(" ") }];
  }
  throw error;
}

const titles = await readTitles();
const translations = await readCache();
const pending = titles.filter(title => !translations[title]).slice(0, limit);
const batches = buildBatches(pending);
const sessionRef = { current: await createBingSession() };
const errors = [];
let completedBatches = 0;

for (let start = 0; start < batches.length; start += concurrency) {
  const group = batches.slice(start, start + concurrency);
  const results = await Promise.allSettled(group.map(batch => translateWithRetry(sessionRef, batch)));
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result.status === "fulfilled") {
      for (const item of result.value) translations[item.title] = item.titleZh;
    } else {
      errors.push({ titles: group[index], error: result.reason?.message || String(result.reason) });
    }
    completedBatches += 1;
  }
  if (completedBatches % 10 === 0 || start + concurrency >= batches.length) {
    await writeCache(translations);
    console.log(`Translated batches ${completedBatches}/${batches.length}; cached titles ${Object.keys(translations).length}`);
  }
  if (delayMs > 0 && start + concurrency < batches.length) await new Promise(resolve => setTimeout(resolve, delayMs));
}

console.log(JSON.stringify({
  sourceTitles: titles.length,
  cached: Object.keys(translations).length,
  translatedThisRun: pending.filter(title => translations[title]).length,
  pending: titles.filter(title => !translations[title]).length,
  batches: batches.length,
  errors: errors.slice(0, 10)
}, null, 2));
