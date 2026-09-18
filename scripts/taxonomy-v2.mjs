import { detailedTerms, detailedTopicTaxonomy } from "./topic-vocabulary.mjs";

const purposeTaxonomy = [
  {
    name: "基础生物学与发育机制",
    description: "利用斑马鱼解释发育、基因功能、细胞行为和信号通路",
    patterns: [
      [/发育|胚胎|器官发生|形态发生|细胞命运|基因功能|分子机制|信号通路|表观遗传|稳态/gi, 5],
      [/development|embryo|organogenesis|morphogenesis|gene function|mechanism|signaling|homeostasis/gi, 4]
    ]
  },
  {
    name: "人类疾病模型与机制",
    description: "建立人类疾病、遗传病和器官功能异常模型",
    patterns: [
      [/疾病模型|人类疾病|临床|患者|致病|病理机制|遗传病|罕见病|综合征|帕金森|阿尔茨海默|癫痫|自闭症|糖尿病|心肌病|肾病|肝病/gi, 6],
      [/disease model|human disease|pathogenesis|patient|syndrome|Parkinson|Alzheimer|epilep|autism|diabetes/gi, 5]
    ]
  },
  {
    name: "药物发现与治疗评价",
    description: "筛选候选药物并评价药效、机制、药代和治疗潜力",
    patterns: [
      [/药物筛选|高通量筛选|药效|药理|治疗作用|保护作用|候选药物|活性化合物|小分子|中药|天然产物|药代动力学/gi, 7],
      [/抗肿瘤|抗炎|神经保护|心脏保护|改善.*模型|逆转.*表型/gi, 4],
      [/drug screen|therapeutic|treatment|efficacy|pharmacolog|compound|small molecule|natural product/gi, 5]
    ]
  },
  {
    name: "环境健康与毒理评价",
    description: "评价污染物、药物和材料暴露的器官毒性与生态风险",
    patterns: [
      [/毒性|毒理|暴露|污染|生态风险|安全性评价|环境激素|内分泌干扰|重金属|农药|微塑料|纳米材料|药物残留/gi, 6],
      [/发育毒性|神经毒性|心脏毒性|肝毒性|肾毒性|生殖毒性|遗传毒性|免疫毒性|氧化应激/gi, 5],
      [/toxicity|toxicology|exposure|pollut|ecotoxic|endocrine disrupt|microplastic|nanomaterial/gi, 5]
    ]
  },
  {
    name: "再生医学与组织修复",
    description: "研究损伤后的组织再生、干细胞响应和功能恢复",
    patterns: [
      [/再生|修复|损伤恢复|断尾|切除|干细胞|祖细胞|细胞谱系|组织重建/gi, 7],
      [/regenerat|repair|injury recovery|stem cell|progenitor|lineage tracing/gi, 6]
    ]
  },
  {
    name: "水产养殖与鱼类健康",
    description: "研究养殖营养、病害防控、繁殖育种和水环境应激",
    patterns: [
      [/水产|养殖|饲料|生长性能|鱼病|病害防控|水质|苗种|繁殖性能|育种|养殖密度/gi, 6],
      [/aquaculture|feed|growth performance|fish disease|water quality|breeding|husbandry/gi, 5]
    ]
  },
  {
    name: "技术平台、资源与方法",
    description: "建立品系、成像、组学、自动化和标准化实验平台",
    patterns: [
      [/方法(?:建立|开发|优化|验证)|平台(?:构建|建立|开发)|模型构建|品系构建|资源库建设|数据库建设|检测方法(?:建立|开发|验证)|标准化(?:体系|流程|方法)/gi, 7],
      [/(?:CRISPR|基因编辑|转基因|单细胞|空间转录组|活体成像|高内涵|自动化|微流控|行为追踪|三维重建|图像分析).{0,12}(?:平台|方法|流程|体系|工具|资源|构建|建立|开发|优化)/gi, 5],
      [/(?:platform|method|assay|pipeline|workflow|resource|database).{0,30}(?:develop|establish|construct|build|optim|validat)|(?:develop|establish|construct|build|optim|validat).{0,30}(?:platform|method|assay|pipeline|workflow|resource|database)/gi, 6]
    ]
  }
];

const systemTaxonomy = [
  ["胚胎与器官发生", "早期胚胎、体轴、体节及器官形成", /胚胎|原肠|体轴|体节|器官发生|形态发生|孵化|embryo|gastrulation|somite|organogenesis/gi],
  ["神经系统", "中枢和外周神经发育、神经元与突触", /神经|脑|脊髓|神经元|胶质|轴突|突触|多巴胺|血清素|neuro|brain|spinal cord|neuron|synap/gi],
  ["行为与认知", "运动、学习记忆、情绪、睡眠和社会行为", /行为|运动轨迹|学习|记忆|焦虑|抑郁|睡眠|昼夜节律|社交|惊跳|趋光|behavior|behaviour|locomot|memory|anxiety|sleep/gi],
  ["视觉、听觉与侧线", "视网膜、眼、耳、毛细胞和侧线感觉", /视觉|视网膜|眼|听觉|耳|毛细胞|侧线|感光|retina|visual|eye|hearing|hair cell|lateral line/gi],
  ["心脏与血管", "心脏发育、心功能、血管和血流", /心脏|心肌|心率|心包|血管|血流|血管生成|cardiac|heart|myocard|vascular|angiogenesis|blood flow/gi],
  ["血液与造血", "造血干细胞、血细胞、凝血和血液疾病", /造血|血细胞|红细胞|白细胞|血小板|凝血|血栓|贫血|白血病|hematopo|erythro|leukocyte|platelet|thrombo|anemia|leukemia/gi],
  ["免疫与感染", "先天免疫、炎症、病原感染和宿主互作", /免疫|炎症|感染|病原|细菌|病毒|真菌|寄生虫|巨噬细胞|中性粒细胞|宿主.*互作|immune|inflamm|infection|pathogen|macrophage|neutrophil/gi],
  ["肿瘤与肿瘤微环境", "肿瘤发生、移植、转移、血管和免疫微环境", /肿瘤|癌|白血病|淋巴瘤|胶质瘤|黑色素瘤|转移|异种移植|tumou?r|cancer|leukemia|lymphoma|glioma|melanoma|metastasis|xenograft/gi],
  ["代谢与内分泌", "糖脂代谢、肥胖、胰岛素和激素调节", /代谢|肥胖|脂质|脂肪|胆固醇|葡萄糖|胰岛素|内分泌|甲状腺|食欲|能量稳态|metabol|obesity|lipid|glucose|insulin|endocrine|thyroid/gi],
  ["肝胆与消化系统", "肝脏、胆道、肠道、胰腺和微生物组", /肝|胆|肠|消化|胰腺|肠道菌群|微生物组|liver|hepatic|bile|gut|intestin|pancrea|microbiome/gi],
  ["肾脏与泌尿系统", "前肾、肾小管、肾功能和泌尿疾病", /肾|前肾|肾小管|泌尿|肾小球|nephro|kidney|renal|pronephro|tubule/gi],
  ["骨骼、肌肉与运动系统", "骨、软骨、肌肉、肌腱和运动功能", /骨骼|骨|软骨|肌肉|肌腱|脊柱|运动系统|skelet|bone|cartilage|muscle|tendon|spine/gi],
  ["生殖与性别决定", "性腺、配子、生育力、性别决定和跨代效应", /生殖|性腺|精子|卵巢|卵母细胞|性别决定|性分化|繁殖|产卵|受精|跨代|reproduct|gonad|oocyte|sperm|fertility|sex determination|transgenerational/gi],
  ["皮肤、色素与鳍", "皮肤屏障、黑色素细胞、色素模式和鳍", /皮肤|色素|黑色素|黑色素细胞|鳍|斑纹|skin|pigment|melanocyte|fin|stripe pattern/gi],
  ["衰老与时间生物学", "衰老、寿命、昼夜节律和年龄相关改变", /衰老|寿命|老化|昼夜节律|生物钟|年龄相关|\baging\b|\bageing\b|lifespan|circadian|clock/gi],
  ["细胞与分子过程", "细胞增殖、死亡、迁移、应激和信号转导", /细胞增殖|凋亡|自噬|铁死亡|焦亡|细胞迁移|氧化应激|DNA损伤|信号通路|apoptosis|autophagy|ferroptosis|migration|oxidative stress|DNA damage|signaling/gi]
].map(([name, description, pattern]) => ({ name, description, patterns: [[pattern, 5]] }));

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileAlias(alias) {
  const escaped = escapeRegex(alias);
  const asciiTerm = /^[\x00-\x7F]+$/.test(alias);
  const source = asciiTerm
    ? `(?:^|[^A-Za-z0-9])${escaped}(?=$|[^A-Za-z0-9])`
    : escaped;
  return new RegExp(source, "gi");
}

const topicTaxonomy = detailedTopicTaxonomy;
const compiledTopicTaxonomy = detailedTopicTaxonomy.map(topic => ({
  ...topic,
  terms: topic.terms.map(term => ({
    ...term,
    aliasMatchers: term.aliases.map(alias => ({ alias, pattern: compileAlias(alias) }))
  }))
}));

const methodRules = [
  ["CRISPR/Cas基因编辑", /CRISPR|Cas9|基因编辑|敲除|敲入|knockout|knock-in/gi],
  ["转基因与报告基因", /转基因|报告基因|荧光品系|transgenic|reporter line|GFP|mCherry/gi],
  ["活体与荧光成像", /活体成像|荧光成像|共聚焦|双光子|光片|\b(?:live|in vivo|fluorescence|fluorescent|confocal|two-photon|light-sheet)?\s*imaging\b|fluorescen|confocal|light-sheet/gi],
  ["高通量与自动化", /高通量|高内涵|自动化|微孔板|high-throughput|high-content|automation|multiwell/gi],
  ["行为学分析", /行为学|行为追踪|运动轨迹|惊跳|新奇缸|明暗箱|behavioral assay|tracking|startle|novel tank|light-dark/gi],
  ["组织病理与显微结构", /组织病理|病理切片|HE染色|电镜|histopathology|histology|electron microscopy/gi],
  ["转录组与RNA测序", /转录组|RNA测序|RNA-seq|transcriptom/gi],
  ["单细胞与空间组学", /单细胞|空间转录组|single-cell|scRNA-seq|spatial transcriptom/gi],
  ["蛋白组与代谢组", /蛋白组|代谢组|脂质组|proteom|metabolom|lipidom/gi],
  ["原位杂交与表达定位", /原位杂交|整体原位|RNAscope|in situ hybridization|WISH/gi],
  ["异种移植与细胞移植", /异种移植|细胞移植|xenograft|cell transplantation/gi],
  ["微流控与芯片", /微流控|芯片|microfluidic|lab-on-a-chip/gi],
  ["计算分析与机器学习", /机器学习|深度学习|图像识别|生物信息学|machine learning|deep learning|computer vision|bioinformatic/gi]
];

const stageRules = [
  ["胚胎", /胚胎|受精后.*小时|hpf|embryo/gi],
  ["幼体/仔鱼", /幼体|仔鱼|受精后.*天|dpf|larva|larvae/gi],
  ["稚鱼", /稚鱼|juvenile/gi],
  ["成年鱼", /成年鱼|成鱼|adult zebrafish|adult fish/gi],
  ["亲本与子代", /亲本|子代|F0|F1|F2|parental|offspring|progeny/gi]
];

const endpointRules = [
  ["存活与死亡", /存活率|死亡率|致死|LC50|survival|mortality|lethal/gi],
  ["畸形与发育表型", /畸形|体长|孵化率|卵黄囊|水肿|malformation|body length|hatching|yolk sac|edema/gi],
  ["心率与血流", /心率|心输出量|血流|heart rate|cardiac output|blood flow/gi],
  ["运动与行为", /运动距离|游泳速度|行为|locomotion|swimming speed|behavior/gi],
  ["氧化应激", /\b(?:ROS|SOD|CAT|MDA)\b|活性氧|氧化应激|oxidative stress/gi],
  ["细胞死亡", /凋亡|自噬|铁死亡|焦亡|apoptosis|autophagy|ferroptosis|pyroptosis/gi],
  ["基因与蛋白表达", /基因表达|蛋白表达|qPCR|Western blot|expression/gi],
  ["炎症与免疫细胞", /炎症因子|巨噬细胞|中性粒细胞|细胞因子|cytokine|macrophage|neutrophil/gi],
  ["组织病理", /组织病理|病理改变|组织损伤|histopathology|tissue injury/gi],
  ["生殖结局", /产卵量|受精率|精子质量|生育力|egg production|fertilization rate|sperm quality|fertility/gi]
];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function findMatches(text, regex) {
  regex.lastIndex = 0;
  return [...text.matchAll(regex)].map(match => match[0]).slice(0, 10);
}

function scoreTaxonomy(items, text) {
  return items.map((item, order) => {
    let score = 0;
    const evidence = [];
    for (const [pattern, weight] of item.patterns) {
      const terms = findMatches(text, pattern);
      if (!terms.length) continue;
      score += weight * Math.min(3, terms.length);
      evidence.push(...terms);
    }
    return { name: item.name, description: item.description || "", parent: item.parent || "", score, evidence: unique(evidence), order };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.order - b.order);
}

function countLiteralMatches(text, pattern) {
  pattern.lastIndex = 0;
  let count = 0;
  while (count < 3 && pattern.exec(text)) count += 1;
  return count;
}

function scoreTopicTaxonomy(items, text) {
  return items.map((item, order) => {
    const matchedTerms = [];
    for (const term of item.terms) {
      const aliases = [];
      let strongestCount = 0;
      for (const { alias, pattern } of term.aliasMatchers) {
        const count = countLiteralMatches(text, pattern);
        if (!count) continue;
        aliases.push(alias);
        strongestCount = Math.max(strongestCount, count);
      }
      if (!strongestCount) continue;
      const score = 6 * Math.min(3, strongestCount) + Math.min(4, Math.max(0, aliases.length - 1));
      matchedTerms.push({
        key: `${item.name}::${term.name}`,
        name: term.name,
        topic: item.name,
        parent: item.parent,
        score,
        evidence: unique(aliases)
      });
    }
    const score = matchedTerms.reduce((sum, term) => sum + term.score, 0);
    return {
      name: item.name,
      description: item.description,
      parent: item.parent,
      score,
      evidence: unique(matchedTerms.flatMap(term => term.evidence)),
      matchedTerms,
      order
    };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.order - b.order);
}

function stripOrder(items) {
  return items.map(({ order, ...item }) => item);
}

function matchRuleNames(rules, text) {
  return rules.filter(([, pattern]) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  }).map(([name]) => name);
}

export function classifyPaperV2(record, toc = null) {
  const title = record.title || "";
  const titleZh = record.titleZh || "";
  const keywords = Array.isArray(record.keywords) ? record.keywords.join(" ") : record.keywords || "";
  const abstract = record.abstract || "";
  const tocText = (toc?.chapters || []).map(item => item.title).join(" ");
  const text = `${title} ${title} ${title} ${titleZh} ${titleZh} ${titleZh} ${keywords} ${keywords} ${abstract} ${tocText}`;

  let purposes = scoreTaxonomy(purposeTaxonomy, text);
  const systems = scoreTaxonomy(systemTaxonomy, text);
  const subtopics = scoreTopicTaxonomy(compiledTopicTaxonomy, text);

  for (const topic of subtopics) {
    if (!topic.parent || systems.some(item => item.name === topic.parent)) continue;
    const system = systemTaxonomy.find(item => item.name === topic.parent);
    if (!system) continue;
    systems.push({
      name: system.name,
      description: system.description,
      parent: "",
      score: Math.max(5, Math.round(topic.score * 0.8)),
      evidence: [`由细分专题推断：${topic.name}`],
      order: systemTaxonomy.indexOf(system)
    });
  }
  systems.sort((a, b) => b.score - a.score || a.order - b.order);

  if (!purposes.length) {
    const fallbackName = /斑马鱼|Danio\s+rerio|zebrafish/i.test(text) ? "基础生物学与发育机制" : "技术平台、资源与方法";
    const fallback = purposeTaxonomy.find(item => item.name === fallbackName);
    purposes = [{ name: fallback.name, description: fallback.description, parent: "", score: 1, evidence: ["题录缺少目的性关键词"], order: purposeTaxonomy.indexOf(fallback) }];
  }

  const purposeThreshold = Math.max(6, Math.round(purposes[0].score * 0.48));
  const systemThreshold = systems.length ? Math.max(5, Math.round(systems[0].score * 0.46)) : 5;
  const topicThreshold = subtopics.length ? Math.max(6, Math.round(subtopics[0].score * 0.5)) : 6;
  const selectedPurposes = stripOrder(purposes.filter(item => item.score >= purposeThreshold).slice(0, 3));
  if (!selectedPurposes.length && purposes[0]) selectedPurposes.push(stripOrder([purposes[0]])[0]);
  const selectedSystems = stripOrder(systems.filter(item => item.score >= systemThreshold).slice(0, 5));
  const selectedTopics = stripOrder(subtopics.filter(item => item.score >= topicThreshold).slice(0, 8));
  const detailTerms = selectedTopics
    .flatMap(item => item.matchedTerms || [])
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "zh-CN"));
  const methods = unique(matchRuleNames(methodRules, text));
  const stages = unique(matchRuleNames(stageRules, text));
  const endpoints = unique(matchRuleNames(endpointRules, text));
  const topPurpose = selectedPurposes[0];
  const topSystem = selectedSystems[0] || null;
  const combinedScore = topPurpose.score + (topSystem?.score || 0) + Math.min(12, selectedTopics.length * 3);
  const confidence = combinedScore >= 34 ? "高" : combinedScore >= 16 ? "中" : "低";
  const basis = unique([...(topPurpose.evidence || []), ...(topSystem?.evidence || []), ...selectedTopics.flatMap(item => item.evidence)]).slice(0, 12);

  return {
    primaryPurpose: topPurpose.name,
    purposes: selectedPurposes,
    primarySystem: topSystem?.name || "跨系统/待复核",
    systems: selectedSystems,
    subtopics: selectedTopics,
    detailTerms,
    methods,
    stages,
    endpoints,
    classificationConfidence: confidence,
    classificationBasis: basis,
    primaryDirection: topPurpose.name,
    directions: selectedPurposes,
    tags: unique([...selectedSystems.map(item => item.name), ...selectedTopics.map(item => item.name), ...detailTerms.map(item => item.name), ...methods, ...stages, ...endpoints])
  };
}

export const classificationSchema = {
  version: "3.0",
  purposes: purposeTaxonomy.map(({ patterns, ...item }) => item),
  systems: systemTaxonomy.map(({ patterns, ...item }) => item),
  subtopics: topicTaxonomy,
  terms: detailedTerms,
  methods: methodRules.map(([name]) => name),
  stages: stageRules.map(([name]) => name),
  endpoints: endpointRules.map(([name]) => name)
};

