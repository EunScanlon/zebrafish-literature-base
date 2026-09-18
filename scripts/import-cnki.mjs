import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const input = path.resolve(args.find(arg => !arg.startsWith("--")) || "data/raw");
const outIndex = args.indexOf("--out");
const output = path.resolve(outIndex >= 0 ? args[outIndex + 1] : "data/metadata.json");
const translationsIndex = args.indexOf("--translations");
const translationsPath = path.resolve(translationsIndex >= 0 ? args[translationsIndex + 1] : "data/translations-en-zh.json");

async function readTranslations() {
  try {
    const payload = JSON.parse(await fs.readFile(translationsPath, "utf8"));
    return payload.translations || payload;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

const translations = await readTranslations();

const aliases = {
  title: ["title", "题名", "题目", "篇名", "文献题名", "t1", "%t", "{title}"],
  titleZh: ["titlezh", "title zh", "translatedtitlezh", "translated title zh", "中文译名", "中文题名", "译名"],
  authors: ["authors", "author", "作者", "责任者", "a1", "au", "%a", "{author}"],
  source: ["source", "来源", "期刊", "刊名", "学位授予单位", "会议名称", "jf", "jo", "t2", "%j", "{secondary title}"],
  year: ["year", "年份", "年", "发表时间", "出版日期", "yr", "py", "%d", "{year}"],
  database: ["database", "数据库", "文献类型", "类型", "reference type", "rt", "ty", "%0", "{reference type}"],
  resourceType: ["resourcetype", "resource type", "资源类型", "类别"],
  language: ["language", "lang", "语种", "语言"],
  keywords: ["keywords", "keyword", "关键词", "关键字", "kw", "k1", "%k", "{keywords}"],
  abstract: ["abstract", "摘要", "内容摘要", "ab", "n2", "%x", "{abstract}"],
  url: ["url", "链接", "知网链接", "原文链接", "ur", "ul", "%u", "{url}"],
  doi: ["doi", "do", "{doi}"],
  citations: ["citations", "被引", "被引频次", "被引量"],
  downloads: ["downloads", "下载", "下载频次", "下载量"]
};

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[：:\s_-]+/g, " ");
}

const aliasLookup = new Map(Object.entries(aliases).flatMap(([target, values]) => values.map(value => [normalizeKey(value), target])));

function clean(value) {
  return String(value ?? "").replace(/^\uFEFF/, "").replace(/\s+/g, " ").trim();
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return clean(value).split(/\s*[;；|]\s*/).map(clean).filter(Boolean);
}

function firstYear(value) {
  return clean(value).match(/(?:19|20)\d{2}/)?.[0] || "";
}

function detectLanguage(title, explicit) {
  const normalized = clean(explicit).toLowerCase();
  if (/外文|英文|英语|foreign|english|\ben\b/.test(normalized)) return "英文";
  if (/中文|汉语|chinese|\bzh\b/.test(normalized)) return "中文";
  return /[\u3400-\u9fff]/u.test(title) ? "中文" : "英文";
}

function normalizeRecord(raw, sourceFile, index) {
  const collected = {};
  for (const [key, value] of Object.entries(raw || {})) {
    const target = aliasLookup.get(normalizeKey(key)) || key;
    if (collected[target] === undefined) collected[target] = value;
    else collected[target] = `${collected[target]}; ${value}`;
  }
  const title = clean(collected.title);
  if (!title) return null;
  const authors = splitList(collected.authors).flatMap(item => item.split(/\s*,\s*/)).filter(Boolean);
  const keywords = splitList(collected.keywords);
  const year = firstYear(collected.year);
  const language = detectLanguage(title, collected.language);
  const resourceType = clean(collected.resourceType || collected.category || collected.database);
  const titleZh = clean(collected.titleZh || translations[title]) || (language === "中文" ? title : "");
  const stable = [title, year, clean(collected.source), resourceType]
    .map(value => value.toLowerCase().replace(/[\s\p{P}]/gu, ""))
    .join("|");
  const id = `zf-${crypto.createHash("sha1").update(stable).digest("hex").slice(0, 18)}`;
  return {
    id,
    title,
    titleZh,
    language,
    resourceType,
    authors,
    source: clean(collected.source),
    year,
    database: clean(collected.database),
    keywords,
    abstract: clean(collected.abstract),
    url: clean(collected.url),
    doi: clean(collected.doi),
    citations: Number(clean(collected.citations).replace(/\D/g, "")) || 0,
    downloads: Number(clean(collected.downloads).replace(/\D/g, "")) || 0,
    sourceFile: path.basename(sourceFile),
    sourceRow: index + 1
  };
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell); cell = "";
      if (row.some(value => clean(value))) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some(value => clean(value))) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map(clean);
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, i) => [header, values[i] || ""])));
}

function parseRis(text) {
  const records = [];
  let current = {};
  const flush = () => { if (Object.keys(current).length) records.push(current); current = {}; };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9]{2})\s{0,2}-\s?(.*)$/);
    if (!match) continue;
    const [, tag, value] = match;
    if (tag === "ER") { flush(); continue; }
    current[tag] = current[tag] ? `${current[tag]}; ${value}` : value;
  }
  flush();
  return records;
}

function parseEndNote(text) {
  const records = [];
  let current = {};
  const flush = () => { if (Object.keys(current).length) records.push(current); current = {}; };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^(%[0A-Z])\s+(.*)$/);
    if (!match) continue;
    const [, tag, value] = match;
    if (tag === "%0" && Object.keys(current).length) flush();
    current[tag] = current[tag] ? `${current[tag]}; ${value}` : value;
  }
  flush();
  return records;
}

function parseBraced(text) {
  const records = [];
  let current = {};
  const flush = () => { if (Object.keys(current).length) records.push(current); current = {}; };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\{([^}]+)\}\s*:\s*(.*)$/);
    if (!match) { if (!clean(line)) flush(); continue; }
    const key = `{${match[1]}}`;
    if (/reference type/i.test(key) && Object.keys(current).length) flush();
    current[key] = current[key] ? `${current[key]}; ${match[2]}` : match[2];
  }
  flush();
  return records;
}

async function listFiles(target) {
  const stat = await fs.stat(target);
  if (stat.isFile()) return [target];
  const entries = await fs.readdir(target, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => listFiles(path.join(target, entry.name))));
  return nested.flat();
}

async function parseFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (![".json", ".csv", ".tsv", ".txt", ".ris", ".enw"].includes(ext)) return [];
  const text = (await fs.readFile(file, "utf8")).replace(/^\uFEFF/, "");
  if (ext === ".json") {
    const payload = JSON.parse(text);
    return Array.isArray(payload) ? payload : payload.records || payload.papers || [];
  }
  if (ext === ".csv" || ext === ".tsv") return parseDelimited(text, ext === ".tsv" ? "\t" : ",");
  if (/^TY\s{0,2}-/m.test(text)) return parseRis(text);
  if (/^%[0A-Z]\s+/m.test(text)) return parseEndNote(text);
  if (/^\{[^}]+\}\s*:/m.test(text)) return parseBraced(text);
  const firstLine = text.split(/\r?\n/, 1)[0];
  return parseDelimited(text, firstLine.includes("\t") ? "\t" : ",");
}

const files = (await listFiles(input)).filter(file => !path.basename(file).startsWith("."));
const imported = [];
const errors = [];
for (const file of files) {
  try {
    const rows = await parseFile(file);
    rows.forEach((row, index) => {
      const normalized = normalizeRecord(row, file, index);
      if (normalized) imported.push(normalized);
    });
  } catch (error) {
    errors.push({ file, error: error.message });
  }
}

const byKey = new Map();
for (const record of imported) {
  const key = [record.title, record.year, record.source, record.resourceType]
    .map(value => String(value || "").toLowerCase().replace(/[\s\p{P}]/gu, ""))
    .join("|");
  const existing = byKey.get(key);
  if (!existing || record.abstract.length + record.keywords.join("").length > existing.abstract.length + existing.keywords.join("").length) byKey.set(key, record);
}
const records = [...byKey.values()].sort((a, b) => (b.year || "").localeCompare(a.year || "") || a.title.localeCompare(b.title, "zh-CN"));
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), records, importReport: { files: files.length, parsed: imported.length, unique: records.length, duplicates: imported.length - records.length, errors } }));
console.log(JSON.stringify({ output, files: files.length, parsed: imported.length, unique: records.length, duplicates: imported.length - records.length, errors }, null, 2));
