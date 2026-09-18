export const taxonomy = [
  {
    name: "发育生物学与器官发生",
    description: "胚胎、幼体发育，器官形成与细胞命运决定",
    patterns: [
      [/胚胎|胚胎发育|早期发育|器官发生|形态发生|原肠|体节|轴突导向|细胞命运|母源效应|孵化/gi, 5],
      [/embryo|development|organogenesis|morphogenesis|gastrulation|somite/gi, 4],
      [/神经嵴|内胚层|外胚层|中胚层|侧线发育|血管发生/gi, 3]
    ]
  },
  {
    name: "遗传调控与分子机制",
    description: "基因功能、信号通路、表观遗传与组学机制",
    patterns: [
      [/基因功能|基因表达|突变体|敲除|敲入|转基因|基因编辑|CRISPR|分子机制|信号通路|表观遗传/gi, 5],
      [/转录组|蛋白组|代谢组|单细胞|测序|组学|microRNA|lncRNA|mRNA/gi, 4],
      [/gene|mutation|knockout|transgenic|pathway|transcriptom|proteom|epigen/gi, 4]
    ]
  },
  {
    name: "神经科学与行为",
    description: "神经发育、脑功能、感觉、学习记忆与行为表型",
    patterns: [
      [/神经|脑|行为|学习|记忆|焦虑|抑郁|睡眠|昼夜节律|运动行为|社交|惊跳|趋光|趋化/gi, 5],
      [/多巴胺|血清素|胆碱能|神经元|神经递质|小胶质细胞|突触/gi, 4],
      [/neuro|brain|behavior|behaviour|memory|anxiety|sleep|locomot/gi, 4]
    ]
  },
  {
    name: "疾病模型与转化医学",
    description: "人类疾病、罕见病、神经退行性疾病和精准医学模型",
    patterns: [
      [/疾病模型|人类疾病|罕见病|遗传病|帕金森|阿尔茨海默|癫痫|自闭症|肌萎缩|肌营养不良|脊柱侧弯/gi, 5],
      [/糖尿病|脂肪肝|肾病|肝病|肠病|眼病|耳聋|心肌病/gi, 3],
      [/disease model|rare disease|Parkinson|Alzheimer|epilep|autism|dystrophy/gi, 4]
    ]
  },
  {
    name: "心血管与血液",
    description: "心脏、血管、造血、血栓与血液疾病",
    patterns: [
      [/心脏|心血管|血管|血流|心肌|心率|心包|造血|红细胞|白血病|血栓|凝血|贫血/gi, 5],
      [/cardiac|heart|vascular|angiogenesis|hematopo|blood|thrombo/gi, 4]
    ]
  },
  {
    name: "肿瘤生物学",
    description: "肿瘤发生、转移、肿瘤微环境与抗肿瘤评价",
    patterns: [
      [/肿瘤|癌|癌症|白血病|淋巴瘤|胶质瘤|黑色素瘤|转移|肿瘤血管|异种移植/gi, 6],
      [/tumou?r|cancer|leukemia|lymphoma|glioma|melanoma|metastasis|xenograft/gi, 5]
    ]
  },
  {
    name: "代谢、营养与内分泌",
    description: "糖脂代谢、营养干预、肥胖和内分泌调节",
    patterns: [
      [/代谢|营养|肥胖|脂质|脂肪|胆固醇|葡萄糖|糖代谢|胰岛素|内分泌|甲状腺|食欲|能量稳态/gi, 5],
      [/饲料|膳食|氨基酸|维生素|多糖|蛋白源|脂肪酸/gi, 3],
      [/metabol|nutrition|obesity|lipid|glucose|insulin|endocrine|thyroid/gi, 4]
    ]
  },
  {
    name: "免疫、感染与炎症",
    description: "免疫发育、病原感染、炎症反应与宿主互作",
    patterns: [
      [/免疫|感染|炎症|病原|细菌|病毒|真菌|寄生虫|巨噬细胞|中性粒细胞|宿主.*互作|肠道菌群/gi, 5],
      [/immune|infection|inflammation|pathogen|bacteria|virus|fung|macrophage|neutrophil|microbiome/gi, 4]
    ]
  },
  {
    name: "再生修复与干细胞",
    description: "组织再生、损伤修复、干细胞与细胞谱系",
    patterns: [
      [/再生|修复|损伤恢复|断尾|心脏再生|视网膜再生|脊髓再生|干细胞|祖细胞|细胞谱系/gi, 6],
      [/regenerat|repair|stem cell|progenitor|lineage tracing/gi, 5]
    ]
  },
  {
    name: "环境与药物毒理",
    description: "污染物、纳米材料、农药、药物与复合暴露毒性",
    patterns: [
      [/毒性|毒理|暴露|污染|重金属|农药|除草剂|杀虫剂|微塑料|纳米材料|环境激素|内分泌干扰|生态风险/gi, 5],
      [/发育毒性|神经毒性|肝毒性|心脏毒性|生殖毒性|遗传毒性|氧化应激/gi, 4],
      [/toxicity|toxicology|exposure|pollut|pesticide|microplastic|nanomaterial|ecotoxic/gi, 4]
    ]
  },
  {
    name: "药物筛选与安全性评价",
    description: "活性化合物筛选、药效、药代和安全性评价",
    patterns: [
      [/药物筛选|高通量筛选|药效|药理|安全性评价|毒性评价|候选药物|活性成分|中药|天然产物|小分子/gi, 5],
      [/抗肿瘤|抗炎|抗氧化|保护作用|治疗作用|药代动力学/gi, 3],
      [/drug screen|screening|pharmacolog|efficacy|safety evaluation|compound/gi, 4]
    ]
  },
  {
    name: "水产养殖与病害防控",
    description: "养殖、饲料、鱼类病害、应激与水环境管理",
    patterns: [
      [/水产|养殖|饲料|生长性能|鱼病|病害|水质|应激|摄食|存活率|繁殖性能|苗种/gi, 4],
      [/aquaculture|feed|growth performance|fish disease|water quality|husbandry/gi, 4]
    ]
  },
  {
    name: "生殖与跨代效应",
    description: "性别决定、生殖发育、生育力与跨代遗传效应",
    patterns: [
      [/生殖|性腺|精子|卵巢|卵母细胞|性别决定|性分化|繁殖|产卵|受精|跨代|多代效应/gi, 5],
      [/reproduct|gonad|oocyte|sperm|fertility|sex determination|transgenerational/gi, 4]
    ]
  },
  {
    name: "成像平台与实验方法",
    description: "模型构建、活体成像、自动化表型与实验技术",
    patterns: [
      [/活体成像|荧光成像|显微成像|自动化|高内涵|微流控|实验方法|模型构建|评价模型|检测方法|转基因技术/gi, 5],
      [/成像平台|行为追踪|图像分析|三维重建|报告基因|品系构建/gi, 4],
      [/imaging|microscopy|automation|high-content|microfluidic|assay|method|model establishment/gi, 4]
    ]
  }
];

export const tagRules = [
  ["胚胎", /胚胎|embryo/gi], ["幼体", /幼体|仔鱼|larva/gi], ["成年鱼", /成年鱼|成鱼|adult zebrafish/gi],
  ["CRISPR", /CRISPR|基因编辑/gi], ["转基因", /转基因|transgenic/gi], ["单细胞", /单细胞|single[- ]cell/gi],
  ["转录组", /转录组|transcriptom/gi], ["蛋白组", /蛋白组|proteom/gi], ["代谢组", /代谢组|metabolom/gi],
  ["氧化应激", /氧化应激|活性氧|ROS/gi], ["行为学", /行为|运动轨迹|behavior|behaviour/gi], ["活体成像", /活体成像|in vivo imaging/gi],
  ["高通量筛选", /高通量|high[- ]throughput/gi], ["发育毒性", /发育毒性|developmental toxicity/gi],
  ["神经毒性", /神经毒性|neurotoxicity/gi], ["心脏毒性", /心脏毒性|cardiotoxicity/gi],
  ["肝毒性", /肝毒性|hepatotoxicity/gi], ["生殖毒性", /生殖毒性|reproductive toxicity/gi],
  ["炎症", /炎症|inflammation/gi], ["感染", /感染|infection/gi], ["肿瘤移植", /异种移植|xenograft/gi]
];

function matchTerms(text, regex) {
  regex.lastIndex = 0;
  return [...text.matchAll(regex)].map(match => match[0]).slice(0, 8);
}

export function classifyPaper(record, toc = null) {
  const title = record.title || "";
  const keywords = Array.isArray(record.keywords) ? record.keywords.join(" ") : record.keywords || "";
  const abstract = record.abstract || "";
  const tocText = (toc?.chapters || []).map(item => item.title).join(" ");
  const weightedText = `${title} ${title} ${title} ${keywords} ${keywords} ${abstract} ${tocText}`;

  const scores = taxonomy.map((category, order) => {
    let score = 0;
    const evidence = [];
    for (const [pattern, weight] of category.patterns) {
      const terms = matchTerms(weightedText, pattern);
      if (!terms.length) continue;
      score += weight * Math.min(3, terms.length);
      evidence.push(...terms);
    }
    return { name: category.name, description: category.description, score, evidence: [...new Set(evidence)].slice(0, 10), order };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.order - b.order);

  const primary = scores[0] || { name: "其他斑马鱼研究", description: "尚未形成稳定主题信号", score: 0, evidence: [] };
  const threshold = Math.max(4, Math.round(primary.score * 0.45));
  const directions = scores.filter(item => item.score >= threshold).slice(0, 4).map(({ order, ...item }) => item);
  const tags = tagRules.filter(([, pattern]) => {
    pattern.lastIndex = 0;
    return pattern.test(weightedText);
  }).map(([name]) => name);
  const confidence = primary.score >= 18 ? "高" : primary.score >= 8 ? "中" : "低";

  return {
    primaryDirection: primary.name,
    directions: directions.length ? directions : [primary],
    tags: [...new Set(tags)],
    classificationConfidence: confidence,
    classificationBasis: [...new Set(primary.evidence)].slice(0, 8)
  };
}
