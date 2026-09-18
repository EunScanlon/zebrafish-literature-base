const state = {
  payload: null,
  papers: [],
  filtered: [],
  axis: "purposes",
  direction: "",
  navQuery: "",
  query: "",
  toc: "all",
  confidence: new Set(),
  source: "",
  language: "",
  resourceType: "",
  year: "",
  sort: "relevance",
  view: "papers",
  page: 1,
  pageSize: 24,
  loadingAll: false
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

function icon(name, size = 18) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}

function refreshIcons() {
  window.lucide?.createIcons();
}

function setOptions(select, values, firstLabel) {
  select.innerHTML = `<option value="">${firstLabel}</option>${values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
}

function updateFilterOptions() {
  const sources = [...new Set(state.papers.map(paper => paper.source).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const languages = [...new Set(state.papers.map(paper => paper.language).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const resourceTypes = [...new Set(state.papers.map(paper => paper.resourceType || paper.database).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const years = [...new Set(state.papers.map(paper => paper.year).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  setOptions($("#sourceFilter"), sources, "全部来源");
  setOptions($("#languageFilter"), languages, "全部语言");
  setOptions($("#resourceTypeFilter"), resourceTypes, "全部资源");
  setOptions($("#yearFilter"), years, "全部年份");
}

function renderMetrics() {
  const stats = state.payload.stats;
  const languageCounts = new Map((stats.languages || []).map(row => [row.name, row.count]));
  const chineseCount = languageCounts.get("中文") || 0;
  const foreignCount = stats.total - chineseCount;
  const translatedCount = stats.translatedTitles || 0;
  const detailClassified = stats.detailClassified ?? state.papers.filter(paper => paper.detailTerms?.length).length;
  const coverage = stats.total ? Math.round(detailClassified / stats.total * 100) : 0;
  $("#metricTotal").textContent = stats.total.toLocaleString("zh-CN");
  $("#metricChinese").textContent = chineseCount.toLocaleString("zh-CN");
  $("#metricForeign").textContent = foreignCount.toLocaleString("zh-CN");
  $("#metricTranslated").textContent = translatedCount.toLocaleString("zh-CN");
  $("#metricCoverage").textContent = `${coverage}%`;
  $("#coverageBar").style.width = `${coverage}%`;
  $("#dataState").textContent = stats.total
    ? `${stats.total.toLocaleString("zh-CN")} 条真实题录${state.loadingAll ? "（正在加载）" : ""}`
    : "等待知网导出数据";
  $("#coverageNote").innerHTML = stats.total
    ? `<strong>当前数据范围</strong><span>中文 ${chineseCount.toLocaleString("zh-CN")} 篇；外文 ${foreignCount.toLocaleString("zh-CN")} 篇，其中 ${translatedCount.toLocaleString("zh-CN")} 篇保留英文原题并附中文译名；${detailClassified.toLocaleString("zh-CN")} 篇已命中详细词汇。</span>`
    : `<strong>当前为空库</strong><span>未放入知网官方导出文件；页面不会用示例论文替代真实题录。</span>`;
}

function renderDirectionNav() {
  const config = {
    purposes: { label: "研究目的", all: "全部目的" },
    systems: { label: "生物系统", all: "全部系统" },
    subtopics: { label: "细分专题", all: "全部专题" },
    terms: { label: "详细词汇", all: "全部词汇" }
  }[state.axis];
  const counts = new Map((state.payload.stats[state.axis] || []).map(row => [row.key || row.name, row.count]));
  const schemaRows = state.payload.classificationSchema?.[state.axis] || [];
  const navQuery = state.navQuery.trim().toLowerCase();
  const rows = schemaRows
    .map(item => ({ ...item, count: counts.get(item.key || item.name) || 0 }))
    .filter(item => !navQuery || [item.name, item.topic, item.parent, ...(item.aliases || [])].join(" ").toLowerCase().includes(navQuery));
  $("#directionNav").innerHTML = [
    `<button type="button" class="direction-button ${state.direction ? "" : "active"}" data-direction=""><span>${config.all}</span><span>${state.payload.stats.total.toLocaleString("zh-CN")}</span></button>`,
    ...rows.map(row => {
      const key = row.key || row.name;
      const context = state.axis === "terms" ? row.topic : "";
      return `<button type="button" class="direction-button ${state.direction === key ? "active" : ""}" data-direction="${escapeHtml(key)}"><span class="direction-label">${escapeHtml(row.name)}${context ? `<small>${escapeHtml(context)}</small>` : ""}</span><span>${row.count}</span></button>`;
    })
  ].join("");
  $$(".direction-button").forEach(button => button.addEventListener("click", () => {
    state.direction = button.dataset.direction;
    state.page = 1;
    renderDirectionNav();
    applyFilters();
  }));
}

function paperAxisItems(paper, axis = state.axis) {
  if (axis === "purposes") return paper.purposes || [];
  if (axis === "systems") return paper.systems || [];
  if (axis === "subtopics") return paper.subtopics || [];
  return paper.detailTerms || [];
}

function searchScore(paper, query) {
  if (!query) return 0;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const fields = [
    [paper.title, 8], [paper.titleZh, 8], [paper.keywords.join(" "), 5], [paper.abstract, 3],
    [paper.primaryPurpose, 5], [paper.primarySystem, 5],
    [paper.purposes.map(item => item.name).join(" "), 4], [paper.systems.map(item => item.name).join(" "), 4],
    [paper.subtopics.map(item => item.name).join(" "), 5],
    [paper.detailTerms.map(item => `${item.name} ${item.topic} ${item.evidence.join(" ")}`).join(" "), 6],
    [paper.methods.join(" "), 4],
    [paper.stages.join(" "), 3], [paper.endpoints.join(" "), 4], [paper.tags.join(" "), 3],
    [paper.tocHeadings.map(item => item.title).join(" "), 5], [paper.authors.join(" "), 2], [paper.source, 2]
  ];
  return tokens.reduce((sum, token) => sum + fields.reduce((fieldSum, [value, weight]) => fieldSum + String(value || "").toLowerCase().includes(token) * weight, 0), 0);
}

function applyFilters() {
  const query = state.query.trim();
  state.filtered = state.papers.map(paper => ({ paper, score: searchScore(paper, query) })).filter(({ paper, score }) => {
    if (query && !score) return false;
    if (state.direction && !paperAxisItems(paper).some(item => (item.key || item.name) === state.direction)) return false;
    if (state.toc === "complete" && paper.tocStatus !== "complete") return false;
    if (state.toc === "pending" && paper.tocStatus === "complete") return false;
    if (state.confidence.size && !state.confidence.has(paper.classificationConfidence)) return false;
    if (state.source && paper.source !== state.source) return false;
    if (state.language && paper.language !== state.language) return false;
    if (state.resourceType && (paper.resourceType || paper.database) !== state.resourceType) return false;
    if (state.year && paper.year !== state.year) return false;
    return true;
  });
  state.filtered.sort((a, b) => {
    if (state.sort === "year") return Number(b.paper.year || 0) - Number(a.paper.year || 0) || b.paper.citations - a.paper.citations;
    if (state.sort === "citations") return b.paper.citations - a.paper.citations || Number(b.paper.year || 0) - Number(a.paper.year || 0);
    return b.score - a.score || Number(b.paper.year || 0) - Number(a.paper.year || 0);
  });
  $("#resultCount").textContent = `${state.filtered.length.toLocaleString("zh-CN")} 篇`;
  const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  state.page = Math.min(state.page, maxPage);
  renderCurrentView();
}

function emptyState(title, body) {
  return `<div class="empty-state"> <div>${icon("database-zap", 42)}<h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></div></div>`;
}

function renderPapers() {
  const target = $("#papersView");
  if (!state.filtered.length) {
    target.innerHTML = emptyState(state.papers.length ? "没有匹配结果" : "尚未导入题录", state.papers.length ? "调整关键词或筛选条件后再查看。" : "将知网官方导出的 CSV、RIS 或文献管理格式放入 data/raw，再运行本地数据管线。");
    $("#pager").hidden = true;
    refreshIcons();
    return;
  }
  const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  const rows = state.filtered.slice((state.page - 1) * state.pageSize, state.page * state.pageSize).map(({ paper }) => `
    <tr data-id="${escapeHtml(paper.id)}" tabindex="0">
      <td><div class="paper-title">${escapeHtml(paper.title)}</div>${paper.titleZh && paper.titleZh !== paper.title ? `<div class="paper-title-zh">${escapeHtml(paper.titleZh)}</div>` : ""}<div class="paper-subline">${escapeHtml(paper.authors.join("；") || "作者未导出")} · ${escapeHtml(paper.language || "未标注")} · ${escapeHtml(paper.resourceType || paper.database || "未标注")}</div></td>
      <td><span class="badge">${escapeHtml(paper.primaryPurpose)}</span></td>
      <td><span class="badge">${escapeHtml(paper.primarySystem)}</span></td>
      <td>${paper.subtopics.length ? escapeHtml(paper.subtopics.slice(0, 2).map(item => item.name).join("；")) : "待复核"}${paper.detailTerms.length ? `<div class="paper-subline">${escapeHtml(paper.detailTerms.slice(0, 3).map(item => item.name).join("；"))}</div>` : ""}</td>
      <td>${escapeHtml(paper.year || "-")}</td>
      <td><span class="badge ${paper.tocStatus === "complete" ? "complete" : "pending"}">${paper.tocStatus === "complete" ? `${paper.tocHeadings.length} 个标题` : "待提取"}</span></td>
    </tr>`).join("");
  target.innerHTML = `<div class="table-wrap"><table><thead><tr><th>题名与作者</th><th>研究目的</th><th>生物系统</th><th>细分专题</th><th>年份</th><th>目录</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  target.querySelectorAll("tbody tr").forEach(row => {
    const open = () => openPaper(row.dataset.id);
    row.addEventListener("click", open);
    row.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") open(); });
  });
  $("#pager").hidden = maxPage <= 1;
  $("#pageStatus").textContent = `${state.page} / ${maxPage}`;
}

function syncAxisButtons() {
  $$(".axis-button").forEach(button => button.classList.toggle("active", button.dataset.axis === state.axis));
}

function axisGroup(key, title, subtitle) {
  const schema = state.payload.classificationSchema?.[key] || [];
  const schemaMap = new Map(schema.map(item => [item.key || item.name || item, typeof item === "string" ? {} : item]));
  const counted = state.payload.stats[key] || [];
  const countMap = new Map(counted.map(row => [row.key || row.name, row.count]));
  const rows = schema.map(item => {
    const normalized = typeof item === "string" ? { name: item } : item;
    return { ...normalized, count: countMap.get(normalized.key || normalized.name) || 0 };
  });
  const max = Math.max(1, ...rows.map(row => row.count));
  const list = rows.map(row => `<button type="button" class="direction-row" data-axis="${key}" data-direction="${escapeHtml(row.key || row.name)}"><div><h3>${escapeHtml(row.name)}</h3><p>${escapeHtml(row.description || row.parent || "")}</p></div><div class="direction-bar"><span style="width:${row.count / max * 100}%"></span></div><strong>${row.count}</strong></button>`).join("");
  return `<section class="axis-group"><div class="axis-group-header"><div><h2>${title}</h2><span>${subtitle}</span></div><span>${rows.length} 类</span></div><div class="direction-list">${list}</div></section>`;
}

function termDictionary() {
  const paperMap = new Map(state.papers.map(paper => [paper.id, paper]));
  const termIndex = new Map((state.payload.termIndex || []).map(term => [term.key, term]));
  const topics = state.payload.classificationSchema?.subtopics || [];
  const groups = topics.map(topic => {
    const terms = (topic.terms || []).map(term => {
      const key = `${topic.name}::${term.name}`;
      const indexed = termIndex.get(key);
      const papers = (indexed?.paperIds || []).map(id => paperMap.get(id)).filter(Boolean);
      return { ...term, key, count: indexed?.count || 0, papers };
    });
    const count = terms.reduce((sum, term) => sum + term.count, 0);
    return `<section class="term-topic"><div class="term-topic-header"><div><h3>${escapeHtml(topic.name)}</h3><p>${escapeHtml(topic.parent)}</p></div><strong>${count} 篇</strong></div><div class="term-list">${terms.map(term => { const preview = term.papers.slice(0, 5); return `<div class="term-entry ${term.papers.length ? "has-papers" : ""}"><button type="button" class="term-button" data-axis="terms" data-direction="${escapeHtml(term.key)}" title="${escapeHtml(term.aliases.join(" / "))}"><span>${escapeHtml(term.name)}</span><strong>${term.count}</strong></button>${preview.length ? `<ol class="term-paper-titles">${preview.map(paper => `<li><span>${escapeHtml(paper.title)}</span>${paper.titleZh && paper.titleZh !== paper.title ? `<small>${escapeHtml(paper.titleZh)}</small>` : ""}</li>`).join("")}</ol>${term.papers.length > preview.length ? `<p class="paper-subline">另有 ${(term.papers.length - preview.length).toLocaleString("zh-CN")} 篇，点击词汇查看全部</p>` : ""}` : ""}</div>`; }).join("")}</div></section>`;
  }).join("");
  return `<section class="axis-group term-dictionary"><div class="axis-group-header"><div><h2>四级：详细词汇</h2><span>每个词均维护中英文同义词和对应论文</span></div><span>${state.payload.classificationSchema?.terms?.length || 0} 词</span></div>${groups}</section>`;
}

function renderDirections() {
  $("#directionsView").innerHTML = [
    axisGroup("purposes", "一级：研究目的", "回答为什么使用斑马鱼"),
    axisGroup("systems", "二级：生物系统", "回答研究斑马鱼的哪个器官或过程"),
    axisGroup("subtopics", "三级：细分专题", "回答具体疾病、暴露或生物学问题"),
    termDictionary()
  ].join("");
  $("#directionsView").querySelectorAll(".direction-row, .term-button").forEach(row => row.addEventListener("click", () => {
    state.axis = row.dataset.axis;
    state.direction = row.dataset.direction;
    state.view = "papers";
    state.page = 1;
    syncAxisButtons();
    renderDirectionNav();
    syncTabs();
    applyFilters();
  }));
  $("#pager").hidden = true;
}

function renderToc() {
  const papers = state.filtered.map(item => item.paper).sort((a, b) => Number(a.tocStatus === "complete") - Number(b.tocStatus === "complete") || Number(b.year || 0) - Number(a.year || 0));
  $("#tocView").innerHTML = papers.length ? `<div class="toc-list">${papers.map(paper => `<button type="button" class="toc-row" data-id="${escapeHtml(paper.id)}"><div><h3>${escapeHtml(paper.title)}</h3><p>${escapeHtml(paper.tocSourceFile || paper.database || "题录")}</p></div><span>${escapeHtml(paper.primaryPurpose)} / ${escapeHtml(paper.primarySystem)}</span><span class="badge ${paper.tocStatus === "complete" ? "complete" : "pending"}">${paper.tocStatus === "complete" ? `${paper.tocHeadings.length} 个标题` : "待提取"}</span></button>`).join("")}</div>` : emptyState("目录队列为空", "导入题录后，尚无目录的论文会自动进入这里。");
  $("#tocView").querySelectorAll(".toc-row").forEach(row => row.addEventListener("click", () => openPaper(row.dataset.id)));
  $("#pager").hidden = true;
  refreshIcons();
}

function syncTabs() {
  $$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === state.view));
  $("#papersView").hidden = state.view !== "papers";
  $("#directionsView").hidden = state.view !== "directions";
  $("#tocView").hidden = state.view !== "toc";
}

function renderCurrentView() {
  syncTabs();
  if (state.view === "papers") renderPapers();
  if (state.view === "directions") renderDirections();
  if (state.view === "toc") renderToc();
}

function openPaper(id) {
  const paper = state.papers.find(item => item.id === id);
  if (!paper) return;
  $("#dialogMeta").textContent = [paper.year, paper.language, paper.resourceType || paper.database, paper.source].filter(Boolean).join(" · ") || "知网题录";
  $("#dialogTitle").textContent = paper.title;
  const scoredBadges = items => items.map(item => `<span class="badge">${escapeHtml(item.name)} · ${item.score}</span>`).join("") || `<span class="paper-subline">待复核</span>`;
  const termBadges = items => items.map(item => `<span class="badge" title="${escapeHtml(item.evidence.join(" / "))}">${escapeHtml(item.name)} · ${escapeHtml(item.topic)}</span>`).join("") || `<span class="paper-subline">暂无</span>`;
  const textBadges = items => items.map(item => `<span class="badge">${escapeHtml(item)}</span>`).join("") || `<span class="paper-subline">暂无</span>`;
  const toc = paper.tocHeadings.length ? `<ol class="toc-tree">${paper.tocHeadings.map(item => `<li style="--level:${Math.min(4, item.level || 1)}"><span>${escapeHtml(item.title)}</span><small>${item.page ? `第 ${item.page} 页` : ""}</small></li>`).join("")}</ol>` : `<p>尚未从本地 PDF、文本或保存的详情页中识别到目录。</p>`;
  $("#dialogBody").innerHTML = `
    ${paper.titleZh && paper.titleZh !== paper.title ? `<section class="translated-title"><span>中文译名</span><h3>${escapeHtml(paper.titleZh)}</h3></section>` : ""}
    <div class="detail-grid">
      <div><span>作者</span><strong>${escapeHtml(paper.authors.join("；") || "未导出")}</strong></div>
      <div><span>关键词</span><strong>${escapeHtml(paper.keywords.join("；") || "未导出")}</strong></div>
      <div><span>主要研究目的</span><strong>${escapeHtml(paper.primaryPurpose)}</strong></div>
      <div><span>主要生物系统</span><strong>${escapeHtml(paper.primarySystem)}</strong></div>
      <div><span>分类置信度</span><strong>${escapeHtml(paper.classificationConfidence)}：${escapeHtml(paper.classificationBasis.join("、") || "待人工复核")}</strong></div>
    </div>
    <section class="detail-section"><h3>分层分类</h3><div class="classification-stack">
      <div class="classification-line"><strong>研究目的</strong><div class="chip-list">${scoredBadges(paper.purposes)}</div></div>
      <div class="classification-line"><strong>生物系统</strong><div class="chip-list">${scoredBadges(paper.systems)}</div></div>
      <div class="classification-line"><strong>细分专题</strong><div class="chip-list">${scoredBadges(paper.subtopics)}</div></div>
      <div class="classification-line"><strong>命中详细词汇</strong><div class="chip-list">${termBadges(paper.detailTerms)}</div></div>
      <div class="classification-line"><strong>实验阶段</strong><div class="chip-list">${textBadges(paper.stages)}</div></div>
      <div class="classification-line"><strong>技术方法</strong><div class="chip-list">${textBadges(paper.methods)}</div></div>
      <div class="classification-line"><strong>观察终点</strong><div class="chip-list">${textBadges(paper.endpoints)}</div></div>
    </div></section>
    <section class="detail-section"><h3>摘要</h3><p>${escapeHtml(paper.abstract || "导出文件未包含摘要。")}</p></section>
    <section class="detail-section"><h3>目录标题</h3>${toc}</section>
    ${state.payload.features?.titleLinks && paper.url ? `<section class="detail-section"><a class="source-link" href="${escapeHtml(paper.url)}" target="_blank" rel="noreferrer">打开知网原记录</a></section>` : ""}`;
  $("#paperDialog").showModal();
  refreshIcons();
}

function bindEvents() {
  $("#searchForm").addEventListener("submit", event => { event.preventDefault(); state.query = $("#searchInput").value; state.page = 1; applyFilters(); });
  $("#searchInput").addEventListener("input", event => { if (!event.target.value) { state.query = ""; state.page = 1; applyFilters(); } });
  $("#taxonomySearch").addEventListener("input", event => { state.navQuery = event.target.value; renderDirectionNav(); });
  $("#sourceFilter").addEventListener("change", event => { state.source = event.target.value; state.page = 1; applyFilters(); });
  $("#languageFilter").addEventListener("change", event => { state.language = event.target.value; state.page = 1; applyFilters(); });
  $("#resourceTypeFilter").addEventListener("change", event => { state.resourceType = event.target.value; state.page = 1; applyFilters(); });
  $("#yearFilter").addEventListener("change", event => { state.year = event.target.value; state.page = 1; applyFilters(); });
  $("#sortMode").addEventListener("change", event => { state.sort = event.target.value; state.page = 1; applyFilters(); });
  $$('input[name="toc"]').forEach(input => input.addEventListener("change", event => { state.toc = event.target.value; state.page = 1; applyFilters(); }));
  $$(".confidence-filter").forEach(input => input.addEventListener("change", event => { event.target.checked ? state.confidence.add(event.target.value) : state.confidence.delete(event.target.value); state.page = 1; applyFilters(); }));
  $$(".axis-button").forEach(button => button.addEventListener("click", () => {
    state.axis = button.dataset.axis;
    state.direction = "";
    state.page = 1;
    syncAxisButtons();
    renderDirectionNav();
    applyFilters();
  }));
  $$(".tab").forEach(tab => tab.addEventListener("click", () => { state.view = tab.dataset.view; renderCurrentView(); }));
  $("#prevPage").addEventListener("click", () => { state.page = Math.max(1, state.page - 1); renderPapers(); });
  $("#nextPage").addEventListener("click", () => { state.page = Math.min(Math.ceil(state.filtered.length / state.pageSize), state.page + 1); renderPapers(); });
  $("#clearFilters").addEventListener("click", () => {
    state.axis = "purposes"; state.direction = ""; state.navQuery = ""; state.query = ""; state.toc = "all"; state.confidence.clear(); state.source = ""; state.language = ""; state.resourceType = ""; state.year = ""; state.page = 1;
    $("#searchInput").value = ""; $("#taxonomySearch").value = ""; $("#sourceFilter").value = ""; $("#languageFilter").value = ""; $("#resourceTypeFilter").value = ""; $("#yearFilter").value = "";
    $$('input[name="toc"]').forEach(input => { input.checked = input.value === "all"; });
    $$(".confidence-filter").forEach(input => { input.checked = false; });
    syncAxisButtons(); renderDirectionNav(); applyFilters();
  });
  $("#closeDialog").addEventListener("click", () => $("#paperDialog").close());
  $("#paperDialog").addEventListener("click", event => { if (event.target === $("#paperDialog")) $("#paperDialog").close(); });
}

async function loadChunk(file) {
  const response = await fetch(`/data/${file}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status} (${file})`);
  return response.json();
}

function yieldToBrowser() {
  return new Promise(resolve => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(resolve, { timeout: 100 });
    else setTimeout(resolve, 0);
  });
}

async function loadRemainingChunks(files) {
  for (const file of files) {
    const chunk = await loadChunk(file);
    state.papers.push(...chunk);
    if (state.query || state.direction || state.toc !== "all" || state.confidence.size || state.source || state.language || state.resourceType || state.year) applyFilters();
    await yieldToBrowser();
  }
  state.loadingAll = false;
  updateFilterOptions();
  renderMetrics();
  renderDirectionNav();
  applyFilters();
}

async function init() {
  try {
    const index = await fetch("/data/library-index.json", { cache: "no-store" }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
    const files = index.paperChunks || [];
    const firstChunk = files.length ? await loadChunk(files[0]) : [];
    state.payload = { ...index, papers: firstChunk };
    state.papers = firstChunk;
    state.loadingAll = files.length > 1;
    updateFilterOptions();
    renderMetrics();
    syncAxisButtons();
    renderDirectionNav();
    bindEvents();
    applyFilters();
    refreshIcons();
    if (state.loadingAll) loadRemainingChunks(files.slice(1)).catch(error => {
      state.loadingAll = false;
      $("#dataState").textContent = `部分数据加载失败：${error.message}`;
    });
  } catch (error) {
    $("#dataState").textContent = "数据读取失败";
    $("#coverageNote").innerHTML = `<strong>构建失败</strong><span>${escapeHtml(error.message)}</span>`;
    $("#papersView").innerHTML = emptyState("无法读取数据", "请先运行 npm run build，再重新打开页面。");
    refreshIcons();
  }
}

init();
