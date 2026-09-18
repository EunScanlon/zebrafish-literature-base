import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPaperV2, classificationSchema } from "./taxonomy-v2.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const dataDir = path.join(root, "data");
const publicDataDir = path.join(root, "public", "data");
const paperChunkSize = 5000;

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeToc(toc) {
  if (!toc) return null;
  const chapters = Array.isArray(toc.chapters) ? toc.chapters : [];
  return { ...toc, chapters, headingCount: chapters.length };
}

function buildStats(papers, importReport, tocReport) {
  const purposeMap = new Map();
  const systemMap = new Map();
  const subtopicMap = new Map();
  const methodMap = new Map();
  const stageMap = new Map();
  const endpointMap = new Map();
  const termMap = new Map();
  const tagMap = new Map();
  for (const paper of papers) {
    for (const item of paper.purposes) purposeMap.set(item.name, (purposeMap.get(item.name) || 0) + 1);
    for (const item of paper.systems) systemMap.set(item.name, (systemMap.get(item.name) || 0) + 1);
    for (const item of paper.subtopics) subtopicMap.set(item.name, (subtopicMap.get(item.name) || 0) + 1);
    for (const item of paper.detailTerms) {
      const key = item.key || `${item.topic}::${item.name}`;
      const current = termMap.get(key) || { key, name: item.name, topic: item.topic, parent: item.parent, count: 0 };
      current.count += 1;
      termMap.set(key, current);
    }
    for (const item of paper.methods) methodMap.set(item, (methodMap.get(item) || 0) + 1);
    for (const item of paper.stages) stageMap.set(item, (stageMap.get(item) || 0) + 1);
    for (const item of paper.endpoints) endpointMap.set(item, (endpointMap.get(item) || 0) + 1);
    for (const tag of paper.tags) tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
  }
  const counts = map => [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
  return {
    total: papers.length,
    withAbstract: papers.filter(paper => paper.abstract).length,
    withKeywords: papers.filter(paper => paper.keywords.length).length,
    translatedTitles: papers.filter(paper => paper.language === "英文" && paper.titleZh).length,
    languages: counts(new Map([...new Set(papers.map(paper => paper.language || "未标注"))].map(name => [name, papers.filter(paper => (paper.language || "未标注") === name).length]))),
    resourceTypes: counts(new Map([...new Set(papers.map(paper => paper.resourceType || paper.database || "未标注"))].map(name => [name, papers.filter(paper => (paper.resourceType || paper.database || "未标注") === name).length]))),
    tocComplete: papers.filter(paper => paper.tocStatus === "complete").length,
    tocPending: papers.filter(paper => paper.tocStatus !== "complete").length,
    highConfidence: papers.filter(paper => paper.classificationConfidence === "高").length,
    lowConfidence: papers.filter(paper => paper.classificationConfidence === "低").length,
    purposes: counts(purposeMap),
    systems: counts(systemMap),
    subtopics: counts(subtopicMap),
    terms: [...termMap.values()].sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic, "zh-CN") || a.name.localeCompare(b.name, "zh-CN")),
    methods: counts(methodMap),
    stages: counts(stageMap),
    endpoints: counts(endpointMap),
    directions: counts(purposeMap),
    tags: counts(tagMap).slice(0, 30),
    importReport,
    tocReport,
    updatedAt: new Date().toISOString()
  };
}

function buildTermIndex(papers) {
  const matches = new Map(classificationSchema.terms.map(term => [term.key, new Set()]));
  for (const paper of papers) {
    for (const term of paper.detailTerms) {
      if (!matches.has(term.key)) matches.set(term.key, new Set());
      matches.get(term.key).add(paper.id);
    }
  }
  return classificationSchema.terms.map(term => {
    const paperIds = [...(matches.get(term.key) || [])];
    return {
      ...term,
      count: paperIds.length,
      paperIds
    };
  });
}

function buildResearchReport(papers, stats) {
  const lines = [
    "# 斑马鱼研究方向统计",
    "",
    `生成时间：${stats.updatedAt}`,
    "",
    `题录总数：${stats.total}；含摘要：${stats.withAbstract}；目录已提取：${stats.tocComplete}；低置信分类：${stats.lowConfidence}。`,
    "",
    "分类同时使用题名、关键词、摘要和目录标题。三级专题由四级受控词汇触发，每个词条均保存对应论文 ID；论文可同时归入多个目的、系统和专题。",
    ""
  ];
  lines.push("## 一级：研究目的", "");
  for (const category of classificationSchema.purposes) {
    const matches = papers.filter(paper => paper.purposes.some(item => item.name === category.name));
    const percent = stats.total ? (matches.length / stats.total * 100).toFixed(1) : "0.0";
    lines.push(`### ${category.name}`, "", `${category.description}。数量：${matches.length}（${percent}%）。`, "");
    for (const paper of matches.sort((a, b) => b.citations - a.citations || Number(b.year || 0) - Number(a.year || 0)).slice(0, 8)) {
      const systems = paper.systems.slice(0, 2).map(item => item.name).join(" / ");
      lines.push(`- ${paper.title}${paper.year ? `（${paper.year}）` : ""}${systems ? `：${systems}` : ""}`);
    }
    if (!matches.length) lines.push("- 暂无匹配题录");
    lines.push("");
  }
  const systemCounts = new Map(stats.systems.map(row => [row.name, row.count]));
  const topicCounts = new Map(stats.subtopics.map(row => [row.name, row.count]));
  const termIndex = buildTermIndex(papers);
  const paperMap = new Map(papers.map(paper => [paper.id, paper]));
  const termsByTopic = new Map();
  for (const term of termIndex) {
    if (!termsByTopic.has(term.topic)) termsByTopic.set(term.topic, []);
    termsByTopic.get(term.topic).push(term);
  }
  lines.push("## 二级：生物系统", "");
  for (const category of classificationSchema.systems) lines.push(`- ${category.name}：${systemCounts.get(category.name) || 0}`);
  lines.push("", "## 三级：细分专题", "");
  for (const category of classificationSchema.subtopics) lines.push(`- ${category.name}：${topicCounts.get(category.name) || 0}`);
  lines.push("", "## 四级：详细词汇与对应论文", "");
  for (const topic of classificationSchema.subtopics) {
    lines.push(`### ${topic.name}`, "");
    for (const term of termsByTopic.get(topic.name) || []) {
      const titles = term.paperIds.slice(0, 5).map(id => paperMap.get(id)).filter(Boolean).map(paper => paper.titleZh && paper.titleZh !== paper.title ? `${paper.title} / ${paper.titleZh}` : paper.title);
      lines.push(`- ${term.name}：${term.count} 篇${titles.length ? `；${titles.join("；")}` : "；暂无对应论文"}`);
    }
    lines.push("");
  }
  lines.push("", "## 技术方法", "");
  for (const row of stats.methods) lines.push(`- ${row.name}：${row.count}`);
  if (!stats.methods.length) lines.push("- 暂无");
  lines.push("");
  const lowConfidence = papers.filter(paper => paper.classificationConfidence === "低").slice(0, 100);
  lines.push("## 待人工复核", "", `低置信分类共 ${stats.lowConfidence} 篇，下面最多列出 100 篇。`, "");
  for (const paper of lowConfidence) lines.push(`- ${paper.title}`);
  if (!lowConfidence.length) lines.push("- 暂无");
  lines.push("");
  return lines.join("\n");
}

export async function buildData() {
  const metadataPayload = await readJson(path.join(dataDir, "metadata.json"), { records: [], importReport: {} });
  const tocPayload = await readJson(path.join(dataDir, "toc.json"), { records: {}, report: {} });
  const tocRecords = tocPayload.records || {};
  const papers = (metadataPayload.records || []).map(record => {
    const toc = normalizeToc(tocRecords[record.id]);
    const classification = classifyPaperV2(record, toc);
    return {
      ...record,
      primaryPurpose: classification.primaryPurpose,
      primarySystem: classification.primarySystem,
      purposes: classification.purposes.map(item => ({ name: item.name, score: item.score, evidence: unique(item.evidence) })),
      systems: classification.systems.map(item => ({ name: item.name, score: item.score, evidence: unique(item.evidence) })),
      subtopics: classification.subtopics.map(item => ({ name: item.name, score: item.score, evidence: unique(item.evidence) })),
      detailTerms: classification.detailTerms.map(item => ({ key: item.key, name: item.name, topic: item.topic, score: item.score, evidence: unique(item.evidence) })),
      methods: classification.methods,
      stages: classification.stages,
      endpoints: classification.endpoints,
      classificationConfidence: classification.classificationConfidence,
      classificationBasis: classification.classificationBasis,
      tags: classification.tags,
      tocStatus: toc?.status || "pending",
      tocMethod: toc?.method || "",
      tocHeadings: toc?.chapters || [],
      tocSourceFile: toc?.sourceFile || "",
      evidenceLevel: toc?.status === "complete" ? 3 : record.abstract ? 2 : 1
    };
  });
  if ((process.env.RENDER === "true" || process.env.RENDER === "1") && papers.length === 0) {
    const existingIndex = await readJson(path.join(publicDataDir, "library-index.json"), null);
    if (existingIndex?.paperCount > 0 && existingIndex?.paperChunks?.length) {
      console.warn("Render source metadata is absent; preserving committed public data.");
      return existingIndex;
    }
  }
  const stats = buildStats(papers, metadataPayload.importReport || {}, tocPayload.report || {});
  const termIndex = buildTermIndex(papers);
  const payload = { generatedAt: new Date().toISOString(), query: "斑马鱼", features: { titleLinks: false }, classificationSchema, taxonomy: classificationSchema.purposes, termIndex, stats, papers };
  await fs.mkdir(publicDataDir, { recursive: true });
  const oldDataFiles = await fs.readdir(publicDataDir);
  await Promise.all(oldDataFiles
    .filter(file => file === "library.json" || file === "library-index.json" || /^papers-\d+\.json$/.test(file))
    .map(file => fs.rm(path.join(publicDataDir, file), { force: true })));
  const paperChunks = [];
  for (let offset = 0; offset < papers.length; offset += paperChunkSize) {
    const chunkNumber = String(paperChunks.length).padStart(3, "0");
    const file = `papers-${chunkNumber}.json`;
    await fs.writeFile(path.join(publicDataDir, file), JSON.stringify(papers.slice(offset, offset + paperChunkSize)));
    paperChunks.push(file);
  }
  const { papers: _papers, ...indexPayload } = payload;
  await fs.writeFile(path.join(publicDataDir, "library-index.json"), JSON.stringify({ ...indexPayload, paperCount: papers.length, paperChunkSize, paperChunks }));
  const csvRows = [
    ["原标题", "中文译名", "语言", "作者", "年份", "来源", "资源类型", "数据库", "主要研究目的", "其他研究目的", "主要生物系统", "其他生物系统", "细分专题", "命中详细词汇", "详细词汇命中依据", "实验阶段", "技术方法", "观察终点", "分类置信度", "分类依据", "关键词", "目录状态", "目录标题", "知网链接"],
    ...papers.map(paper => [paper.title, paper.titleZh, paper.language, paper.authors.join("; "), paper.year, paper.source, paper.resourceType, paper.database, paper.primaryPurpose, paper.purposes.slice(1).map(item => item.name).join("; "), paper.primarySystem, paper.systems.slice(1).map(item => item.name).join("; "), paper.subtopics.map(item => item.name).join("; "), paper.detailTerms.map(item => `${item.topic}/${item.name}`).join("; "), paper.detailTerms.map(item => `${item.name}:${item.evidence.join("/")}`).join("; "), paper.stages.join("; "), paper.methods.join("; "), paper.endpoints.join("; "), paper.classificationConfidence, paper.classificationBasis.join("; "), paper.keywords.join("; "), paper.tocStatus, paper.tocHeadings.map(item => item.title).join(" | "), paper.url])
  ];
  const csv = csvRows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  await fs.writeFile(path.join(publicDataDir, "zebrafish-literature.csv"), `\uFEFF${csv}`);
  await fs.writeFile(path.join(publicDataDir, "research-directions.md"), buildResearchReport(papers, stats));
  return payload;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const payload = await buildData();
  console.log(JSON.stringify(payload.stats, null, 2));
}
