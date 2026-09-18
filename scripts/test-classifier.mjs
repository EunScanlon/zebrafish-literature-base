import assert from "node:assert/strict";
import { classifyPaperV2, classificationSchema } from "./taxonomy-v2.mjs";

const cases = [
  {
    title: "基因调控斑马鱼胚胎心脏发育的分子机制",
    expectedPurpose: "基础生物学与发育机制",
    expectedSystem: "心脏与血管",
    expectedTopic: "心脏发育与先天性心脏病",
    expectedTerm: "心脏发育"
  },
  {
    title: "斑马鱼帕金森病模型的候选小分子药物高通量筛选",
    expectedPurpose: "药物发现与治疗评价",
    expectedSystem: "神经系统",
    expectedTopic: "神经退行性疾病",
    expectedTerm: "帕金森病"
  },
  {
    title: "微塑料暴露对斑马鱼胚胎的神经发育毒性和行为影响",
    expectedPurpose: "环境健康与毒理评价",
    expectedSystem: "神经系统",
    expectedTopic: "神经行为毒性",
    expectedTerm: "神经发育毒性"
  },
  {
    title: "斑马鱼尾鳍损伤后的骨与肌肉再生机制",
    expectedPurpose: "再生医学与组织修复",
    expectedSystem: "骨骼、肌肉与运动系统",
    expectedTopic: "鳍、骨与肌肉再生",
    expectedTerm: "鳍再生"
  },
  {
    title: "饲料添加剂对养殖斑马鱼生长性能和脂代谢的影响",
    expectedPurpose: "水产养殖与鱼类健康",
    expectedSystem: "代谢与内分泌",
    expectedTopic: "饲料营养与生长性能",
    expectedTerm: "饲料添加剂"
  },
  {
    title: "基于CRISPR转基因报告品系和活体成像的斑马鱼自动化平台构建",
    expectedPurpose: "技术平台、资源与方法",
    expectedMethod: "CRISPR/Cas基因编辑",
    expectedTerm: "自动化筛选平台"
  },
  {
    title: "活体成像揭示斑马鱼胚胎心脏发育的细胞迁移机制",
    expectedPurpose: "基础生物学与发育机制",
    expectedSystem: "心脏与血管",
    expectedTopic: "心脏发育与先天性心脏病",
    expectedMethod: "活体与荧光成像",
    expectedTerm: "心脏发育"
  },
  {
    title: "Duplicate cardiac development study using imaging in zebrafish embryos",
    expectedPurpose: "基础生物学与发育机制",
    expectedSystem: "心脏与血管",
    expectedTopic: "心脏发育与先天性心脏病",
    expectedMethod: "活体与荧光成像",
    expectedTerm: "心脏发育",
    expectedNotEndpoint: "氧化应激"
  },
  {
    title: "斑马鱼肿瘤异种移植模型用于天然产物抗肿瘤药效评价",
    expectedPurpose: "药物发现与治疗评价",
    expectedSystem: "肿瘤与肿瘤微环境",
    expectedTopic: "肿瘤移植、侵袭与转移",
    expectedTerm: "异种移植"
  },
  {
    title: "典型制药废水对斑马鱼慢性毒性效应研究",
    expectedPurpose: "环境健康与毒理评价",
    expectedSystem: "细胞与分子过程",
    expectedTopic: "一般毒性与生态风险",
    expectedTerm: "慢性毒性"
  },
  {
    title: "斑马鱼Pellino E3泛素蛋白连接酶2基因克隆及表达分析",
    expectedPurpose: "基础生物学与发育机制",
    expectedSystem: "细胞与分子过程",
    expectedTopic: "基因克隆、表达与蛋白功能",
    expectedTerm: "基因克隆"
  },
  {
    title: "基于斑马鱼模型的化妆品美白功效评价",
    expectedPurpose: "基础生物学与发育机制",
    expectedSystem: "皮肤、色素与鳍",
    expectedTopic: "皮肤功效与化妆品评价",
    expectedTerm: "美白"
  },
  {
    title: "基于斑马鱼行为学改变的水质应急监测技术研究",
    expectedPurpose: "水产养殖与鱼类健康",
    expectedSystem: "细胞与分子过程",
    expectedTopic: "生物检测、标志物与环境监测",
    expectedTerm: "应急监测"
  }
];

for (const testCase of cases) {
  const result = classifyPaperV2({ title: testCase.title, keywords: [], abstract: "" });
  assert.equal(result.primaryPurpose, testCase.expectedPurpose, `${testCase.title}: purpose`);
  if (testCase.expectedSystem) assert.ok(result.systems.some(item => item.name === testCase.expectedSystem), `${testCase.title}: system`);
  if (testCase.expectedTopic) assert.ok(result.subtopics.some(item => item.name === testCase.expectedTopic), `${testCase.title}: topic`);
  if (testCase.expectedTerm) assert.ok(result.detailTerms.some(item => item.name === testCase.expectedTerm), `${testCase.title}: detail term`);
  if (testCase.expectedMethod) assert.ok(result.methods.includes(testCase.expectedMethod), `${testCase.title}: method`);
  if (testCase.expectedNotEndpoint) assert.ok(!result.endpoints.includes(testCase.expectedNotEndpoint), `${testCase.title}: unexpected endpoint`);
}

assert.ok(classificationSchema.subtopics.length >= 85, "expected at least 85 detailed topics");
assert.ok(classificationSchema.terms.length >= 650, "expected at least 650 controlled terms");
assert.ok(classificationSchema.subtopics.every(item => Array.isArray(item.terms) && item.terms.length >= 5), "every topic must contain detailed terms");
assert.equal(new Set(classificationSchema.terms.map(item => item.key)).size, classificationSchema.terms.length, "term keys must be unique");
assert.ok(classificationSchema.terms.every(item => item.topic && item.parent && item.aliases.length), "every term must be traceable to a topic and system");

console.log(JSON.stringify({ ok: true, cases: cases.length }));
