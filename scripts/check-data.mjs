import fs from "node:fs/promises";

const dataDir = new URL("../public/data/", import.meta.url);
const index = JSON.parse(await fs.readFile(new URL("library-index.json", dataDir), "utf8"));
const chunks = await Promise.all((index.paperChunks || []).map(file => fs.readFile(new URL(file, dataDir), "utf8").then(JSON.parse)));
const payload = { ...index, papers: chunks.flat() };
const ids = new Set();
const errors = [];
for (const paper of payload.papers || []) {
  if (!paper.id) errors.push("missing id");
  if (!paper.title) errors.push(`${paper.id}: missing title`);
  if (!paper.language) errors.push(`${paper.id}: missing language`);
  if (paper.language === "中文" && paper.titleZh !== paper.title) errors.push(`${paper.id}: Chinese title mismatch`);
  if (ids.has(paper.id)) errors.push(`${paper.id}: duplicate id`);
  ids.add(paper.id);
  if (!paper.primaryPurpose) errors.push(`${paper.id}: missing primary purpose`);
  if (!Array.isArray(paper.systems)) errors.push(`${paper.id}: missing systems`);
  if (!Array.isArray(paper.subtopics)) errors.push(`${paper.id}: missing subtopics`);
  if (!Array.isArray(paper.detailTerms)) errors.push(`${paper.id}: missing detail terms`);
}
if (payload.stats.total !== payload.papers.length) errors.push("stats total mismatch");
if (!Array.isArray(payload.termIndex)) errors.push("missing term index");
if ((payload.termIndex || []).length !== (payload.classificationSchema?.terms || []).length) errors.push("term index size mismatch");
const paperIds = new Set((payload.papers || []).map(paper => paper.id));
for (const term of payload.termIndex || []) {
  if (!term.key || !term.name || !term.topic || !term.parent) errors.push("invalid term index row");
  if (!Array.isArray(term.aliases) || !term.aliases.length) errors.push(`${term.key}: missing aliases`);
  if (!Array.isArray(term.paperIds)) errors.push(`${term.key}: missing paper links`);
  if (term.count !== term.paperIds.length) errors.push(`${term.key}: paper link count mismatch`);
  for (const id of term.paperIds || []) if (!paperIds.has(id)) errors.push(`${term.key}: unknown paper ${id}`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const detailClassified = (payload.papers || []).filter(paper => paper.detailTerms.length > 0).length;
console.log(JSON.stringify({
  ok: true,
  papers: payload.papers.length,
  directions: payload.stats.directions.length,
  subtopics: payload.classificationSchema.subtopics.length,
  terms: payload.classificationSchema.terms.length,
  detailClassified,
  detailCoverage: Number((detailClassified / payload.papers.length * 100).toFixed(1)),
  lowConfidence: payload.stats.lowConfidence,
  tocComplete: payload.stats.tocComplete
}));
