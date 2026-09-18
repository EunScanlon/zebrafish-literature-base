function makeTerm(row) {
  const [name, ...aliases] = row.split("|").map(value => value.trim()).filter(Boolean);
  return { name, aliases: [...new Set([name, ...aliases])] };
}

function topic(name, parent, rows) {
  const terms = rows.map(makeTerm);
  return {
    name,
    parent,
    description: terms.slice(0, 5).map(item => item.name).join("、"),
    terms
  };
}

// 四级受控词表。论文只有命中这里的具体词或同义词，才会进入相应三级专题。
export const detailedTopicTaxonomy = [
  topic("早期胚胎与形态发生", "胚胎与器官发生", [
    "卵裂|cleavage", "原肠运动|原肠胚形成|gastrulation|gastrulation movement", "体轴建立|轴向发育|axis formation|body axis", "体节发生|体节形成|somitogenesis|somite formation", "胚层形成|germ layer formation", "胚胎形态发生|形态发生|embryonic morphogenesis|morphogenesis", "胚胎发育|早期胚胎发育|胚胎早期发育|embryonic development|embryo development", "早期发育|early development", "孵化|孵化率|hatching"
  ]),
  topic("器官发生与细胞命运", "胚胎与器官发生", [
    "器官发生|器官形成|organogenesis", "细胞命运|cell fate", "细胞分化|differentiation|cell differentiation", "细胞谱系|lineage|cell lineage", "谱系示踪|lineage tracing", "祖细胞|progenitor cell", "器官前体|organ primordium"
  ]),
  topic("颅面、牙齿与咽弓发育", "骨骼、肌肉与运动系统", [
    "颅面发育|craniofacial development", "咽弓|pharyngeal arch", "牙齿发育|tooth development|odontogenesis", "下颌发育|jaw development", "颅骨|cranial skeleton", "神经嵴衍生物|neural crest derivative"
  ]),
  topic("肝脏、胰腺与胆道发育", "肝胆与消化系统", [
    "肝脏发育|liver development|hepatic development", "胰腺发育|pancreas development|pancreatic development", "胆道发育|biliary development|bile duct development", "肝细胞分化|hepatocyte differentiation", "胰岛发育|islet development", "内胚层器官发生|endodermal organogenesis"
  ]),
  topic("神经发育与轴突导向", "神经系统", [
    "神经管发育|neural tube development", "神经发生|neurogenesis", "神经嵴|neural crest", "轴突导向|axon guidance", "轴突生长|axon growth", "髓鞘形成|myelination", "运动神经元发育|motor neuron development"
  ]),
  topic("突触与神经递质", "神经系统", [
    "突触形成|synaptogenesis|synapse formation", "突触可塑性|synaptic plasticity", "多巴胺|dopamine", "血清素|5-HT|serotonin", "谷氨酸能|glutamatergic|glutamate", "GABA能|GABAergic|GABA", "胆碱能|cholinergic|acetylcholine"
  ]),
  topic("痛觉、感觉神经与成瘾", "神经系统", [
    "痛觉|伤害感受|nociception|pain behavior", "感觉神经元|sensory neuron", "阿片反应|opioid response", "酒精依赖|alcohol dependence|ethanol preference", "尼古丁依赖|nicotine dependence", "药物成瘾|drug addiction|substance dependence"
  ]),
  topic("学习记忆与社会行为", "行为与认知", [
    "学习|learning", "记忆|memory", "习惯化|habituation", "社会行为|社交行为|social behavior|social interaction", "群游|shoaling", "攻击行为|aggression", "条件反射|conditioning"
  ]),
  topic("运动、感觉与应激行为", "行为与认知", [
    "运动行为|自主运动|locomotor behavior|locomotor activity", "游泳行为|游泳活动|swimming behavior", "运动能力|运动活性|活动度|motor ability|activity level", "行为障碍|行为异常|behavioral disorder|behavioral abnormality", "行为反应|行为效应|behavioral response|behavioral effect", "惊跳反应|惊跳行为|startle response", "趋光行为|趋光性|phototaxis", "视觉偏好|光谱偏好|visual preference", "应激反应|stress response"
  ]),
  topic("焦虑、抑郁与应激行为", "行为与认知", [
    "焦虑样行为|焦虑|anxiety-like behavior|anxiety", "抑郁样行为|抑郁|depression-like behavior|depression", "恐惧反应|fear response", "应激行为|behavioral stress|stress behavior", "新奇缸实验|novel tank test", "明暗偏好|light-dark preference"
  ]),
  topic("睡眠与昼夜节律", "衰老与时间生物学", [
    "睡眠|sleep", "失眠|insomnia", "助眠|改善睡眠|sleep improvement", "觉醒|wakefulness|arousal", "昼夜节律|circadian rhythm", "生物钟|circadian clock|biological clock", "褪黑素|melatonin", "时差反应|jet lag", "睡眠剥夺|sleep deprivation"
  ]),
  topic("神经退行性疾病", "神经系统", [
    "帕金森病|帕金森|Parkinson disease|Parkinson's disease", "阿尔茨海默病|阿尔茨海默|Alzheimer disease|Alzheimer's disease", "亨廷顿病|Huntington disease|Huntington's disease", "肌萎缩侧索硬化|ALS|amyotrophic lateral sclerosis", "tau蛋白病|tauopathy", "神经退行性变|neurodegeneration|neurodegenerative disease"
  ]),
  topic("神经发育与精神疾病", "神经系统", [
    "自闭症谱系障碍|自闭症|autism spectrum disorder|autism", "注意缺陷多动障碍|ADHD|attention deficit hyperactivity disorder", "精神分裂症|schizophrenia", "双相情感障碍|bipolar disorder", "智力障碍|intellectual disability", "脆性X综合征|fragile X syndrome"
  ]),
  topic("癫痫与神经损伤", "神经系统", [
    "癫痫|epilepsy", "惊厥|癫痫发作|seizure|convulsion", "脑缺血|cerebral ischemia|brain ischemia", "脑损伤|brain injury|traumatic brain injury", "兴奋性毒性|excitotoxicity", "神经元损伤|neuronal injury"
  ]),
  topic("视网膜与视觉疾病", "视觉、听觉与侧线", [
    "视网膜发育|retinal development", "视觉发育|视觉系统发育|visual development", "视觉功能|visual function|vision", "视觉损伤|视觉障碍|visual injury|visual impairment", "视神经发育|optic nerve development", "光转导|phototransduction", "青光眼|glaucoma", "黄斑变性|macular degeneration", "视网膜色素变性|retinitis pigmentosa", "近视|myopia", "光感受器|photoreceptor"
  ]),
  topic("听觉、毛细胞与侧线", "视觉、听觉与侧线", [
    "听觉|hearing|auditory", "耳毒性|ototoxicity", "毛细胞|hair cell", "侧线系统|侧线|lateral line", "前庭功能|vestibular function", "内耳发育|inner ear development"
  ]),
  topic("嗅觉、味觉与化学感受", "视觉、听觉与侧线", [
    "嗅觉|olfaction|olfactory", "嗅球|olfactory bulb", "味觉|gustation|taste", "嗅觉神经元|olfactory neuron", "化学感受|chemosensation|chemosensory"
  ]),
  topic("心脏发育与先天性心脏病", "心脏与血管", [
    "心脏发育|cardiac development|heart development", "先天性心脏病|congenital heart disease", "心脏环化|cardiac looping|heart looping", "心脏瓣膜发育|cardiac valve development|valve development", "心脏畸形|heart defect|cardiac malformation", "心肌细胞分化|cardiomyocyte differentiation"
  ]),
  topic("心功能与心肌病", "心脏与血管", [
    "心肌病|cardiomyopathy", "心力衰竭|heart failure", "心律失常|arrhythmia", "QT间期|QT interval|long QT", "心肌收缩力|cardiac contractility|contractile function", "心功能|cardiac function", "心率|heart rate"
  ]),
  topic("血管生成与血管疾病", "心脏与血管", [
    "血管生成|angiogenesis", "血管发生|vasculogenesis", "血管发育|vascular development", "内皮细胞|endothelial cell", "血管通透性|vascular permeability", "高血压|hypertension", "脑血管|cerebrovascular"
  ]),
  topic("造血干细胞与血细胞发育", "血液与造血", [
    "造血干细胞|hematopoietic stem cell|HSC", "造血发生|hematopoiesis", "红细胞生成|erythropoiesis", "髓系发生|myelopoiesis", "淋巴细胞发生|lymphopoiesis", "血细胞分化|blood cell differentiation"
  ]),
  topic("贫血、凝血与血栓", "血液与造血", [
    "贫血|anemia", "凝血|coagulation", "血栓形成|血栓|thrombosis", "出血|bleeding|hemorrhage", "血小板|platelet|thrombocyte", "凝血因子|coagulation factor"
  ]),
  topic("白血病与血液肿瘤", "血液与造血", [
    "急性髓系白血病|AML|acute myeloid leukemia", "急性淋巴细胞白血病|ALL|acute lymphoblastic leukemia", "白血病|leukemia", "淋巴瘤|lymphoma", "骨髓增生异常|myelodysplastic syndrome", "骨髓增殖性肿瘤|myeloproliferative neoplasm"
  ]),
  topic("先天免疫与炎症", "免疫与感染", [
    "先天免疫|innate immunity", "炎症反应|炎症|inflammation|inflammatory response", "巨噬细胞|macrophage", "中性粒细胞|neutrophil", "补体系统|complement system", "细胞因子|cytokine", "炎症小体|inflammasome"
  ]),
  topic("炎症性疾病与过敏", "免疫与感染", [
    "溃疡性结肠炎|ulcerative colitis", "肠炎|enteritis", "类风湿关节炎|rheumatoid arthritis", "系统性红斑狼疮|systemic lupus erythematosus|SLE", "过敏反应|抗过敏|allergic response|anti-allergic", "炎症性疾病|inflammatory disease", "脑膜炎|meningitis"
  ]),
  topic("适应性免疫与免疫调控", "免疫与感染", [
    "适应性免疫|adaptive immunity", "T细胞|T cell|T lymphocyte", "B细胞|B cell|B lymphocyte", "抗体反应|antibody response", "免疫耐受|immune tolerance", "免疫调节|immune regulation|immunoregulation"
  ]),
  topic("免疫功能与免疫毒性", "免疫与感染", [
    "免疫功能|immune function", "免疫低下|免疫缺陷|immunodeficiency|low immunity", "免疫抑制|immunosuppression", "免疫毒性|immunotoxicity", "免疫应答|免疫反应|immune response", "免疫力|免疫能力|immune capacity", "免疫增强|增强免疫|immunoenhancement", "免疫损伤|immune injury"
  ]),
  topic("细菌、病毒与真菌感染", "免疫与感染", [
    "细菌感染|bacterial infection", "病毒感染|viral infection", "真菌感染|fungal infection", "病原感染|病原体感染|pathogen infection", "分枝杆菌感染|mycobacterial infection|Mycobacterium", "爱德华氏菌|Edwardsiella", "气单胞菌|Aeromonas", "李斯特菌|Listeria", "弧菌感染|Vibrio infection", "诺如病毒|norovirus", "宿主病原互作|host-pathogen interaction", "感染模型|infection model"
  ]),
  topic("寄生虫感染与宿主防御", "免疫与感染", [
    "寄生虫感染|parasitic infection|parasite infection", "原虫感染|protozoan infection", "蠕虫感染|helminth infection", "宿主防御|host defense", "抗寄生虫反应|antiparasitic response"
  ]),
  topic("肿瘤发生与驱动基因", "肿瘤与肿瘤微环境", [
    "肿瘤发生|tumorigenesis|carcinogenesis", "癌基因|oncogene", "抑癌基因|tumor suppressor gene", "驱动突变|driver mutation|driver gene", "克隆演化|clonal evolution", "癌前病变|precancerous lesion"
  ]),
  topic("抗肿瘤药物与临床转化", "肿瘤与肿瘤微环境", [
    "抗肿瘤药物|抗癌药物|anticancer drug|antitumor drug", "抗肿瘤活性|抗癌活性|anticancer activity|antitumor activity", "肿瘤药物筛选|cancer drug screening", "肿瘤模型|癌症模型|tumor model|cancer model", "移植瘤|xenograft tumor", "肿瘤治疗|癌症治疗|cancer therapy", "临床转化|转化医学|clinical translation|translational medicine"
  ]),
  topic("肿瘤移植、侵袭与转移", "肿瘤与肿瘤微环境", [
    "异种移植|xenograft", "患者来源异种移植|patient-derived xenograft|PDX", "肿瘤侵袭|tumor invasion|invasion", "肿瘤转移|metastasis|tumor metastasis", "循环肿瘤细胞|circulating tumor cell", "肿瘤细胞移植|tumor cell transplantation"
  ]),
  topic("肿瘤血管与免疫微环境", "肿瘤与肿瘤微环境", [
    "肿瘤血管生成|tumor angiogenesis", "肿瘤免疫|tumor immunity", "肿瘤微环境|tumor microenvironment", "肿瘤相关巨噬细胞|tumor-associated macrophage", "肿瘤缺氧|tumor hypoxia", "免疫逃逸|immune evasion"
  ]),
  topic("实体肿瘤类型与精准治疗", "肿瘤与肿瘤微环境", [
    "黑色素瘤|melanoma", "胶质瘤|glioma", "肝癌|hepatocellular carcinoma|liver cancer", "胰腺癌|pancreatic cancer", "结直肠癌|colorectal cancer", "乳腺癌|breast cancer", "精准治疗|precision oncology|precision medicine"
  ]),
  topic("糖尿病、肥胖与脂代谢", "代谢与内分泌", [
    "糖尿病|diabetes mellitus|diabetes", "肥胖|obesity", "胰岛素抵抗|insulin resistance", "葡萄糖代谢|glucose metabolism", "脂质代谢|脂代谢|lipid metabolism", "脂肪生成|adipogenesis", "高血糖|hyperglycemia"
  ]),
  topic("血脂、动脉粥样硬化与循环代谢", "心脏与血管", [
    "动脉粥样硬化|atherosclerosis", "高脂血症|hyperlipidemia", "血脂异常|dyslipidemia", "降血脂|降脂作用|lipid lowering|hypolipidemic", "血脂水平|blood lipid level", "胆固醇代谢|cholesterol metabolism", "高胆固醇血症|hypercholesterolemia", "血液循环|促进循环|blood circulation"
  ]),
  topic("甲状腺与内分泌调节", "代谢与内分泌", [
    "甲状腺|thyroid", "甲状腺激素|thyroid hormone", "下丘脑垂体甲状腺轴|HPT axis|hypothalamic-pituitary-thyroid axis", "皮质醇|cortisol", "生长激素|growth hormone", "内分泌稳态|endocrine homeostasis"
  ]),
  topic("脂肪肝与肝损伤", "肝胆与消化系统", [
    "非酒精性脂肪肝|NAFLD|MASLD|MASH|nonalcoholic fatty liver disease|metabolic dysfunction-associated steatotic liver disease", "酒精性肝病|酒精性脂肪肝|alcoholic liver disease", "肝脂肪变性|hepatic steatosis|fatty liver", "肝纤维化|抗纤维化|hepatic fibrosis|liver fibrosis|antifibrotic", "肝炎|hepatitis", "药物性肝损伤|drug-induced liver injury|DILI", "肝损伤|肝脏损伤|liver injury|hepatic injury", "护肝作用|肝保护|hepatoprotection|hepatoprotective", "肝功能|liver function|hepatic function"
  ]),
  topic("肠道发育、屏障与微生物组", "肝胆与消化系统", [
    "肠道发育|gut development|intestinal development", "肠屏障|肠黏膜|intestinal barrier|gut barrier|intestinal mucosa", "肠道损伤|肠损伤|intestinal injury|gut injury", "肠道菌群|肠道微生物|肠道微生态|gut microbiota|intestinal microbiota", "微生物组|微生物群落|microbiome|microbial community", "炎症性肠病|inflammatory bowel disease|IBD", "肠道定植|intestinal colonization|gut colonization", "肠神经系统|enteric nervous system", "肠道运动|intestinal motility"
  ]),
  topic("肾脏发育与肾病", "肾脏与泌尿系统", [
    "前肾发育|pronephros development|pronephric development", "肾小球|glomerulus|glomerular", "肾小管|renal tubule|kidney tubule", "急性肾损伤|acute kidney injury|AKI", "肾病|nephropathy|kidney disease", "多囊肾|polycystic kidney disease|PKD"
  ]),
  topic("骨骼发育与骨病", "骨骼、肌肉与运动系统", [
    "骨骼发育|骨发育|skeletal development|bone development", "成骨|骨化|osteogenesis|ossification|bone formation", "骨矿化|骨矿物质|bone mineralization", "骨代谢|bone metabolism", "骨量|bone mass", "软骨发育|软骨内骨化|cartilage development|chondrogenesis|endochondral ossification", "骨质疏松|osteoporosis", "脊柱侧弯|scoliosis", "破骨细胞|osteoclast", "肌间刺|intermuscular bone", "骨骼健康|bone health", "骨折愈合|fracture healing"
  ]),
  topic("肌肉发育与肌病", "骨骼、肌肉与运动系统", [
    "肌肉发育|muscle development|myogenesis", "肌营养不良|muscular dystrophy", "肌病|myopathy", "肌节|sarcomere", "神经肌肉接头|neuromuscular junction", "肌肉萎缩|muscle atrophy"
  ]),
  topic("皮肤屏障、创伤与炎症", "皮肤、色素与鳍", [
    "皮肤屏障|skin barrier", "皮肤发育|skin development", "皮肤创伤|skin wound|cutaneous wound", "伤口愈合|wound healing", "皮肤炎症|skin inflammation|dermatitis", "上皮修复|epithelial repair"
  ]),
  topic("皮肤功效与化妆品评价", "皮肤、色素与鳍", [
    "化妆品功效评价|化妆品功效|cosmetic efficacy evaluation", "化妆品安全性|化妆品安全评价|cosmetic safety", "美白|美白功效|whitening", "祛斑|淡斑|spot fading", "抗皱|抗皱功效|anti-wrinkle", "抗皮肤老化|皮肤老化|skin anti-aging|skin aging", "保湿|保湿功效|moisturizing", "舒缓修护|舒缓功效|修护功效|soothing and repair", "皮肤刺激性|skin irritation"
  ]),
  topic("色素细胞与色素模式", "皮肤、色素与鳍", [
    "黑色素细胞|melanocyte", "色素模式|pigment pattern", "条纹形成|stripe formation|stripe pattern", "黑色素生成|melanogenesis", "色素细胞迁移|pigment cell migration", "白化|albinism"
  ]),
  topic("性别决定与性腺发育", "生殖与性别决定", [
    "性别决定|sex determination", "性分化|sex differentiation", "性腺发育|gonad development", "卵巢发育|ovary development|ovarian development", "睾丸发育|testis development|testicular development", "性逆转|sex reversal"
  ]),
  topic("生育力、配子与受精", "生殖与性别决定", [
    "精子发生|spermatogenesis", "卵子发生|oogenesis", "卵母细胞成熟|oocyte maturation", "受精|fertilization", "生育力|fertility", "产卵|spawning|egg production", "配子质量|gamete quality"
  ]),
  topic("跨代与多代效应", "生殖与性别决定", [
    "跨代效应|transgenerational effect", "多代效应|multigenerational effect", "母源效应|maternal effect", "父源效应|paternal effect", "表观遗传继承|epigenetic inheritance", "子代效应|offspring effect|progeny effect"
  ]),
  topic("衰老与年龄相关疾病", "衰老与时间生物学", [
    "衰老|aging|ageing", "寿命|lifespan|longevity", "细胞衰老|cellular senescence|senescence", "虚弱|frailty", "年龄相关退化|age-related degeneration", "抗衰老|anti-aging|anti-ageing"
  ]),
  topic("心脏与血管再生", "心脏与血管", [
    "心脏再生|heart regeneration|cardiac regeneration", "心肌再生|myocardial regeneration", "心肌细胞增殖|cardiomyocyte proliferation", "瘢痕消退|scar regression|scar resolution", "再血管化|revascularization", "血管再生|vascular regeneration"
  ]),
  topic("神经与脊髓再生", "神经系统", [
    "脊髓再生|脊髓损伤修复|spinal cord regeneration|spinal cord repair", "轴突再生|axon regeneration", "神经再生|神经损伤修复|nerve regeneration|neural regeneration|neural repair", "胶质桥|glial bridge", "脑修复|脑损伤修复|brain repair", "周围神经再生|peripheral nerve regeneration"
  ]),
  topic("视网膜再生", "视觉、听觉与侧线", [
    "视网膜再生|retinal regeneration", "Muller胶质细胞|Muller glia|Muller glial cell", "光感受器再生|photoreceptor regeneration", "视网膜损伤|retinal injury", "视神经再生|optic nerve regeneration"
  ]),
  topic("鳍、骨与肌肉再生", "骨骼、肌肉与运动系统", [
    "鳍再生|尾鳍损伤|鳍损伤|fin regeneration|fin injury|caudal fin injury", "尾鳍再生|尾鳍修复|caudal fin regeneration|caudal fin repair", "骨再生|bone regeneration", "肌肉再生|muscle regeneration", "鳞片再生|scale regeneration", "骨骼修复|skeletal repair"
  ]),
  topic("发育毒性与致畸", "胚胎与器官发生", [
    "发育毒性|developmental toxicity", "胚胎毒性|embryotoxicity|embryo toxicity", "致畸性|致畸|teratogenicity|teratogen", "胚胎畸形|malformation|embryonic malformation", "孵化抑制|hatching inhibition", "卵黄囊水肿|yolk sac edema", "心包水肿|pericardial edema"
  ]),
  topic("一般毒性与生态风险", "细胞与分子过程", [
    "急性毒性|急性毒性试验|acute toxicity", "慢性毒性|亚慢性毒性|chronic toxicity|subchronic toxicity", "毒性效应|毒理效应|toxic effect|toxicological effect", "生态毒性|生态毒理|ecotoxicity|ecotoxicology", "安全性评价|安全评价|safety assessment|safety evaluation", "风险评估|生态风险|risk assessment|ecological risk", "半数致死浓度|LC50|median lethal concentration", "毒性检测|生物毒性检测|toxicity testing|toxicity assay", "剂量反应|剂量-反应|dose response|dose-response", "全生命周期暴露|life-cycle exposure"
  ]),
  topic("神经行为毒性", "神经系统", [
    "神经毒性|neurotoxicity", "神经发育毒性|developmental neurotoxicity", "行为毒性|behavioral toxicity", "神经行为改变|神经行为|neurobehavioral change|neurobehavior", "运动行为异常|locomotor abnormality", "乙酰胆碱酯酶|acetylcholinesterase|AChE"
  ]),
  topic("心血管毒性", "心脏与血管", [
    "心脏毒性|cardiotoxicity", "心血管毒性|cardiovascular toxicity", "心包水肿|pericardial edema", "心率异常|abnormal heart rate", "心律失常|arrhythmia", "血管毒性|vascular toxicity"
  ]),
  topic("肝肾毒性", "肝胆与消化系统", [
    "肝毒性|hepatotoxicity", "肾毒性|nephrotoxicity", "肝损伤|liver injury|hepatic injury", "肾损伤|kidney injury|renal injury", "肝肾毒性|hepatorenal toxicity", "肝肾组织病理|hepatorenal histopathology"
  ]),
  topic("生殖与内分泌干扰", "生殖与性别决定", [
    "生殖毒性|reproductive toxicity", "内分泌干扰|endocrine disruption|endocrine disrupting", "雌激素效应|estrogenic effect", "雄激素效应|androgenic effect", "甲状腺干扰|thyroid disruption", "性腺毒性|gonadal toxicity", "生育力下降|reduced fertility"
  ]),
  topic("遗传毒性与氧化应激", "细胞与分子过程", [
    "遗传毒性|genotoxicity", "DNA损伤|DNA damage", "微核试验|微核|micronucleus assay|micronucleus", "氧化应激|oxidative stress", "活性氧|reactive oxygen species|ROS", "抗氧化酶|antioxidant enzyme|SOD|CAT", "脂质过氧化|lipid peroxidation|MDA"
  ]),
  topic("抗炎、抗氧化与组织保护", "细胞与分子过程", [
    "抗炎作用|抗炎活性|抗炎机制|anti-inflammatory activity|anti-inflammatory effect", "抗氧化作用|抗氧化活性|抗氧化能力|antioxidant activity|antioxidant capacity", "抗糖化|anti-glycation", "抗过敏|anti-allergic", "抗应激|缓解应激|anti-stress", "减毒作用|减毒效应|减毒存效|toxicity attenuation", "解毒作用|detoxification", "组织保护|器官保护|tissue protection|organ protection", "损伤缓解|缓解损伤|injury alleviation"
  ]),
  topic("重金属与无机污染物", "细胞与分子过程", [
    "铅暴露|铅|lead exposure|lead", "镉暴露|镉|cadmium exposure|cadmium", "汞暴露|汞|mercury exposure|mercury", "砷暴露|砷|arsenic exposure|arsenic", "铜暴露|铜|copper exposure", "铬暴露|六价铬|chromium exposure|hexavalent chromium", "重金属|heavy metal"
  ]),
  topic("农药、兽药与药物残留", "细胞与分子过程", [
    "杀虫剂|insecticide", "除草剂|herbicide", "杀菌剂|fungicide", "农药|pesticide", "兽药|veterinary drug", "抗生素残留|antibiotic residue", "药物残留|pharmaceutical residue|drug residue"
  ]),
  topic("微塑料、纳米材料与新污染物", "细胞与分子过程", [
    "微塑料|microplastic", "纳米塑料|nanoplastic", "纳米材料|纳米颗粒|nanomaterial|nanoparticle", "全氟化合物|多氟烷基化合物|PFAS|PFASs|PFOA|PFOS|PFHxS|perfluoroalkyl substance|polyfluoroalkyl substance", "阻燃剂|flame retardant", "双酚A|BPA|bisphenol A", "邻苯二甲酸酯|phthalate", "新污染物|emerging contaminant"
  ]),
  topic("工业化学品与持久性污染物", "细胞与分子过程", [
    "有机磷酸酯|organophosphate ester", "持久性有机污染物|persistent organic pollutant|POP", "内分泌干扰物|环境激素|endocrine disrupting chemical|EDC", "药品与个人护理品|PPCPs|pharmaceuticals and personal care products", "橡胶添加剂|6PPD|6PPD-Q|rubber additive", "多环芳烃|PAHs|polycyclic aromatic hydrocarbon", "多氯联苯|PCBs|polychlorinated biphenyl", "二噁英|TCDD|dioxin", "对羟基苯甲酸酯|paraben", "制药废水|工业废水|pharmaceutical wastewater|industrial wastewater", "环境污染物|environmental pollutant"
  ]),
  topic("水环境与复合暴露", "细胞与分子过程", [
    "复合暴露|combined exposure|co-exposure", "混合毒性|mixture toxicity", "联合毒性|combined toxicity", "污水暴露|wastewater exposure", "沉积物毒性|sediment toxicity", "环境样品|environmental sample", "富营养化|eutrophication"
  ]),
  topic("小分子与高通量药物筛选", "细胞与分子过程", [
    "小分子筛选|small molecule screening", "高通量筛选|high-throughput screening", "高内涵筛选|high-content screening", "化合物库|compound library", "表型筛选|phenotypic screening", "药物重定位|drug repurposing|drug repositioning", "靶点验证|target validation"
  ]),
  topic("中药与天然产物评价", "细胞与分子过程", [
    "中药|中医药|traditional Chinese medicine|TCM", "天然产物|natural product", "植物提取物|水提物|水提取物|醇提物|醇提取物|herbal extract|plant extract|aqueous extract|ethanol extract", "精油|挥发油|essential oil", "多酚|polyphenol", "多糖|polysaccharide", "黄酮|flavonoid", "生物碱|alkaloid", "萜类|terpenoid"
  ]),
  topic("药代、吸收与体内分布", "细胞与分子过程", [
    "药代动力学|药代|pharmacokinetics|pharmacokinetic", "吸收|absorption", "组织分布|体内分布|biodistribution|tissue distribution", "药物代谢|体内代谢|代谢路径|drug metabolism|metabolic pathway", "代谢物鉴定|代谢物分析|metabolite identification", "排泄|excretion", "生物利用度|bioavailability", "ADME|absorption distribution metabolism excretion"
  ]),
  topic("药效学与治疗评价", "细胞与分子过程", [
    "药效学|pharmacodynamics", "药效评价|药效验证|efficacy evaluation|efficacy validation", "疗效评价|治疗效果|therapeutic efficacy", "治疗作用|therapeutic effect", "保护作用|保护效应|protective effect", "干预作用|干预效果|intervention effect", "活性评价|生物活性评价|activity evaluation|bioactivity evaluation", "效毒评价|效-毒研究|efficacy-toxicity evaluation", "效益风险|效益-风险|benefit-risk"
  ]),
  topic("基因功能、遗传变异与调控", "细胞与分子过程", [
    "基因功能|gene function", "遗传变异|genetic variation|genetic variant", "突变体|mutant|mutation", "基因调控|gene regulation|transcriptional regulation", "基因互作|genetic interaction|gene interaction", "剂量效应|gene dosage|dosage effect"
  ]),
  topic("基因克隆、表达与蛋白功能", "细胞与分子过程", [
    "基因克隆|分子克隆|gene cloning|molecular cloning", "表达分析|表达特征|expression analysis|expression profile", "表达模式|表达谱|expression pattern", "时空表达|组织表达|spatiotemporal expression|tissue expression", "亚细胞定位|subcellular localization", "蛋白结构|蛋白功能|protein structure|protein function", "全长cDNA|cDNA序列|full-length cDNA", "启动子分析|启动子活性|promoter analysis|promoter activity", "转录因子|transcription factor", "蛋白互作|蛋白质相互作用|protein interaction"
  ]),
  topic("基因编辑、转基因与功能验证", "细胞与分子过程", [
    "基因敲除|敲除品系|gene knockout|knockout line", "基因敲低|基因沉默|gene knockdown|gene silencing", "基因敲入|gene knock-in", "基因编辑|CRISPR/Cas|CRISPR-Cas|gene editing", "基因过表达|过表达模型|gene overexpression", "转基因技术|转基因斑马鱼|transgenic technology|transgenic zebrafish", "反向遗传学|reverse genetics", "吗啉代寡核苷酸|Morpholino|morpholino", "基因功能验证|功能验证|functional validation", "品系构建|基因编辑品系|line construction"
  ]),
  topic("组学与系统生物学", "细胞与分子过程", [
    "转录组学|转录组|RNA测序|RNA-seq|transcriptomics|transcriptome", "单细胞转录组|单细胞测序|scRNA-seq|single-cell RNA sequencing", "空间转录组|spatial transcriptomics", "代谢组学|代谢组|metabolomics|metabolome", "蛋白质组学|蛋白组学|蛋白组|proteomics|proteome", "脂质组学|脂质组|lipidomics|lipidome", "基因组学|全基因组|genomics|whole genome", "表观组学|ChIP-seq|epigenomics", "网络药理学|network pharmacology", "生物信息学|多组学|bioinformatics|multi-omics"
  ]),
  topic("表观遗传与非编码RNA", "细胞与分子过程", [
    "DNA甲基化|DNA methylation", "组蛋白修饰|histone modification", "染色质重塑|chromatin remodeling", "微小RNA|microRNA|miRNA", "长链非编码RNA|long noncoding RNA|lncRNA", "环状RNA|circular RNA|circRNA", "表观遗传|epigenetics|epigenetic regulation"
  ]),
  topic("信号通路与分子网络", "细胞与分子过程", [
    "Wnt信号|Wnt signaling|Wnt pathway", "Notch信号|Notch signaling|Notch pathway", "Hedgehog信号|Hedgehog signaling|Shh signaling", "BMP信号|BMP signaling", "FGF信号|FGF signaling", "mTOR信号|mTOR signaling", "MAPK信号|MAPK signaling", "PI3K-AKT信号|PI3K-AKT signaling"
  ]),
  topic("细胞死亡、自噬与应激", "细胞与分子过程", [
    "细胞凋亡|apoptosis", "自噬|autophagy", "铁死亡|ferroptosis", "焦亡|pyroptosis", "内质网应激|endoplasmic reticulum stress|ER stress", "线粒体应激|mitochondrial stress", "蛋白质稳态|proteostasis"
  ]),
  topic("纤毛、细胞器与膜运输", "细胞与分子过程", [
    "纤毛|纤毛病|cilia|cilium|ciliopathy", "线粒体功能|线粒体损伤|mitochondrial function|mitochondrial damage", "溶酶体|lysosome", "内质网|endoplasmic reticulum", "外泌体|exosome", "细胞外囊泡|extracellular vesicle", "膜运输|跨膜运输|membrane trafficking|transmembrane transport", "离子通道|ion channel", "离子细胞|ionocyte"
  ]),
  topic("干细胞、细胞迁移与组织稳态", "细胞与分子过程", [
    "干细胞|stem cell", "祖细胞|progenitor cell", "细胞迁移|cell migration", "细胞增殖|cell proliferation", "组织稳态|tissue homeostasis", "细胞极性|cell polarity", "上皮间质转化|epithelial-mesenchymal transition|EMT"
  ]),
  topic("功能食品与营养健康评价", "代谢与内分泌", [
    "功能食品|functional food", "保健食品|health food|dietary supplement", "营养健康|健康功效|nutritional health|health benefit", "降血糖|降糖作用|hypoglycemic effect", "抗疲劳|缓解疲劳|anti-fatigue", "解酒|减轻醉酒|醒酒|anti-hangover", "补血功效|补血作用|blood-enriching effect", "降尿酸|高尿酸血症|uric acid lowering|hyperuricemia", "食品功效评价|生理功效|food efficacy evaluation"
  ]),
  topic("饲料营养与生长性能", "代谢与内分泌", [
    "蛋白质营养|protein nutrition|dietary protein", "脂质营养|lipid nutrition|dietary lipid", "营养强化|nutritional enrichment", "饲料添加剂|feed additive", "益生菌|probiotic", "生长性能|生长状况|growth performance|growth status", "饲料系数|feed conversion ratio|FCR", "肠道健康|肝肠健康|gut health|liver and gut health", "抗病能力|抗病力|disease resistance"
  ]),
  topic("养殖病害与病原防控", "免疫与感染", [
    "水产疫苗|fish vaccine|aquaculture vaccine", "细菌性鱼病|bacterial fish disease", "病毒性鱼病|viral fish disease", "寄生虫性鱼病|parasitic fish disease", "抗菌治疗|antimicrobial treatment", "抗病力|disease resistance", "病原防控|pathogen control"
  ]),
  topic("水质、密度与养殖应激", "细胞与分子过程", [
    "低氧应激|低氧耐受|缺氧|hypoxia stress|hypoxia tolerance|hypoxia", "盐度应激|盐度胁迫|salinity stress", "温度应激|温度胁迫|高温胁迫|低温胁迫|thermal stress|temperature stress", "热应激|heat stress", "冷应激|cold stress", "养殖密度|stocking density", "氨氮|ammonia nitrogen|ammonia", "亚硝酸盐|nitrite", "pH应激|pH stress|acidification"
  ]),
  topic("繁殖育种与种质资源", "生殖与性别决定", [
    "选择育种|selective breeding", "种质资源|germplasm resource|germplasm", "遗传多样性|genetic diversity", "繁殖性能|reproductive performance", "亲鱼管理|broodstock management", "分子标记辅助育种|marker-assisted selection", "家系选育|family selection"
  ]),
  topic("模型构建、品系与资源库", "细胞与分子过程", [
    "突变品系构建|突变品系|mutant line construction|mutant line", "转基因品系构建|转基因品系|transgenic line construction|transgenic line", "疾病模型构建|疾病模型建立|疾病模型|disease model construction|disease model", "动物模型构建|动物模型建立|animal model construction", "模型建立|模型的建立|模型构建|模型的构建|model establishment|model construction", "人源化模型|humanized model", "药效评价模型|毒性评价模型|efficacy model|toxicity evaluation model", "模型应用|模型用于|模型在|model application", "报告品系|reporter line", "资源库建设|资源库|resource repository|resource database", "数据库建设|数据库|database construction|database", "数据管理系统|信息管理系统|data management system", "标准化模型|standardized model"
  ]),
  topic("成像、自动化与计算平台", "细胞与分子过程", [
    "活体成像平台|活体成像|in vivo imaging|live imaging platform", "荧光成像|fluorescence imaging", "显微成像|显微镜成像|microscopic imaging|microscopy imaging", "超分辨成像|STED|super-resolution imaging", "光学相干断层成像|OCT|optical coherence tomography", "高内涵平台|高内涵成像|high-content platform|high-content imaging", "自动化筛选平台|自动化平台|自动化管理|automated screening platform|automation platform", "行为追踪系统|behavior tracking system", "微流控平台|微流控芯片|microfluidic platform|microfluidic chip", "生物传感器|biosensor", "图像分析方法|图像处理|image analysis method|image processing", "机器学习分类|机器学习|machine learning classification"
  ]),
  topic("实验动物、饲养与标准化", "细胞与分子过程", [
    "实验动物|laboratory animal", "模式动物|模式生物|model organism", "斑马鱼饲养|饲养管理|zebrafish husbandry", "鱼房管理|斑马鱼鱼房|fish facility management", "繁殖与饲养|breeding and husbandry", "健康监测|health monitoring", "动物福利|animal welfare", "实验标准化|标准化管理|experimental standardization", "质量控制|quality control"
  ]),
  topic("生物检测、标志物与环境监测", "细胞与分子过程", [
    "生物检测|生物测定|bioassay|biological detection", "毒性评估|毒性评价|toxicity assessment|toxicity evaluation", "生物标志物|生物标记物|biomarker", "水质监测|水质检测|water quality monitoring", "应急监测|emergency monitoring", "生态监测|生态评价|ecological monitoring", "环境监测|environmental monitoring", "指示生物|indicator organism", "生物传感检测|biosensing", "在线监测|online monitoring"
  ]),
  topic("教学、科普与标准规范", "细胞与分子过程", [
    "实验教学|教学实验|experimental teaching", "教学改革|teaching reform", "虚拟实验|虚拟仿真实验|virtual experiment", "课程建设|课程改革|curriculum development", "科普教育|科学普及|science popularization", "团体标准|group standard", "技术规范|标准制定|technical specification|standard development", "实验指南|操作规程|experimental guideline"
  ])
];

export const detailedTerms = detailedTopicTaxonomy.flatMap(item => item.terms.map(term => ({
  ...term,
  key: `${item.name}::${term.name}`,
  topic: item.name,
  parent: item.parent
})));
