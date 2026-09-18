# 105教研室 · 斑马鱼知网文献库

版权归 105教研室所有。

本项目复用此前秀丽隐杆线虫知识库的“题录 -> 目录 -> 分类 -> 网站”路线，但把高频网页抓取替换为知网结果页的批量题录读取和官方导出文件优先。这样能显著减少安全验证，同时不会绕过验证码、登录或访问权限。

当前已纳入知网“斑马鱼”检索的中文、外文结果：72,808 条唯一题名（中文 10,107；英文/外文 62,701）。中文总库交叉核对 10,112 条结果，外文总库按年份分批核对 63,001 条结果；同题、同年、同来源记录按题名键去重。外文记录保留原标题，并使用批处理翻译生成中文译名；网站显示原标题和中文译名，不下载全文，也不启用知网超链接。网站数据构建为一个 `library-index.json` 索引文件和多个 `papers-*.json` 论文分片，每片默认 5,000 条，避免单个数据文件超过 GitHub 的 100 MB 限制。

## 推荐流程

1. 在中国知网检索关键词“斑马鱼”。
2. 使用知网页面自带的导出功能，分批导出 CSV、RIS/EndNote、RefWorks、NoteExpress 或 JSON。
3. 将导出文件放入 `data/raw/`。现有批量结果文件已经在该目录；`data/archive/` 保存分类页快照和旧版采集文件，不参与最终导入。
4. 将已合法下载的 PDF 放入 `data/pdfs/`。CAJ 建议先用 CAJViewer 另存为 PDF；脚本不会破解 CAJ。
5. 运行：

```powershell
npm run pipeline
npm start
```

打开 `http://127.0.0.1:4188/`。

云端部署使用已经生成的公开分片数据，不在服务器启动时重新读取本地知网源文件。Render 的启动命令应使用：

```text
npm run start:public
```

### 非公开访问

站点默认要求访问密码。密码不会以明文保存：登录页在浏览器中使用 Web Crypto API 计算 SHA-256，服务端只比对 `SITE_PASSWORD_HASH`，登录成功后签发 30 天有效的签名 HttpOnly Cookie。Render 必须使用 HTTPS；不要把密码或密码哈希提交到 Git。

本地生成密码哈希：

```powershell
npm run auth:hash
```

在 Render 的 Environment Variables 中填写：

```text
SITE_PASSWORD_HASH=<上一步输出的64位小写哈希>
SITE_COOKIE_SECRET=<随机生成的长期密钥>
```

随机密钥可以用下面的命令生成：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

添加变量后重新部署。`/api/health` 保持公开以供 Render 健康检查，首页、脚本、题录 JSON、CSV 和关于页均需要登录。

## 对外访问

服务默认监听 `0.0.0.0`，因此启动后，同一局域网的设备可通过运行电脑的 IPv4 地址访问，例如 `http://192.168.1.20:4188/`。Windows 防火墙首次拦截时，请允许 Node.js 在专用网络通信；不要把个人电脑端口直接暴露到互联网。

需要让互联网中的任何人访问时，将项目部署到支持 Node.js 的云主机或平台，并保留启动命令 `npm start`。平台会自动注入 `PORT`，服务已经兼容该环境；部署完成后使用平台提供的 HTTPS 域名即可。公开部署前请确认知网导出数据的使用范围和版权要求。

本机临时分享可以双击项目目录中的 `start-public-site.cmd`。它会在后台维持 Node 服务和 Cloudflare HTTPS 隧道；隧道地址会写入 `data/public-runtime/tunnel.log`。也可以手动执行：

```powershell
& "C:\path\to\cloudflared.exe" tunnel --no-autoupdate --protocol http2 --url http://127.0.0.1:4188
```

命令会输出一个 `https://*.trycloudflare.com` 地址，可直接发给手机或其他人打开。该地址依赖电脑和网络，守护脚本会自动重启断开的服务；隧道重建后网址可能变化。长期分享仍应部署到云主机并绑定固定域名。

站点简介页位于 `/about.html`，作者头像文件为 `public/assets/author-105.jpg`，站内版权署名为“105教研室”。

仅处理题录时，可运行：

```powershell
npm run import
npm run build
```

## 输入格式

`scripts/import-cnki.mjs` 会递归读取 `data/raw/`，支持：

- CSV / TSV
- RIS / EndNote tagged text
- RefWorks tagged text
- NoteExpress tagged text
- JSON 数组，或包含 `records` / `papers` 的 JSON

常见字段会归一化为：题名、作者、来源、年份、文献类型、关键词、摘要、知网链接、DOI、被引量、下载量。

只导入论文题名也可以。准备一个仅含“题名”列的 CSV 放入 `data/raw/`，分类器会只依据题名匹配四级词汇，并在每个词汇下以纯文字列出对应题名。当前网页关闭题名超链接，原始链接字段可以保留，后续再统一启用。

## 知网快速采集

`scripts/cnki-browser-collector.mjs` 是给已打开的知网结果页使用的断点式采集器。它只读取结果列表中可见的题名、作者、来源、年份、文献类型和题名链接，不读取全文，也不尝试处理验证码；遇到滑块/拼图验证会立即停止并保存进度。`scripts/cnki-receiver.mjs` 提供本地接收和带重试的原子保存。

采集步骤：在知网按“斑马鱼”检索并切换到一个资源类别（例如“学术期刊”），让结果页停在要继续的位置，然后在浏览器运行时调用 `collectCnkiCategory({ tab, category, outPath, expectedTotalRecords, pageSize })`。输出 JSON 会写入 `data/raw/`，每 10 页自动保存，可重复运行以断点续采。外文翻译使用 `npm run translate -- --concurrency 8 --delay 100`，完成后执行 `npm run pipeline`，题名会自动分类到 664 个受控词条中。

## 目录提取

`scripts/extract-toc.py` 优先读取 PDF 书签；没有书签时扫描前 30 页，识别“第一章”“1.2”“材料与方法”“结果”“讨论”等标题。它也能读取同名 `.txt` 或保存下来的 `.html` 文件。

目录识别结果写入 `data/toc.json`，并保留提取方式、页码、置信度和错误状态。无法解析的 CAJ 会进入待转换队列，不会被悄悄跳过。

## 分类原则

分类器同时使用题名、关键词、摘要和目录标题，并保存触发分类的命中词。新版采用多轴结构，不再把所有信息塞进一个方向：

- 一级研究目的：基础机制、疾病模型、药物发现、环境毒理、再生医学、水产健康、技术平台。
- 二级生物系统：胚胎、神经、行为、感觉、心血管、血液、免疫、肿瘤、代谢、肝肠、肾脏、骨骼肌肉、生殖、皮肤色素、衰老、细胞分子过程。
- 三级细分专题：共 89 项，覆盖神经退行性疾病、心脏发育、肿瘤移植、一般毒性、发育毒性、微塑料、免疫功能、天然产物、药效评价、组学、基因工程、化妆品功效、实验动物管理和技术平台等。
- 四级详细词汇：共 664 个受控词条，每个词条包含中英文同义词，并维护命中的论文 ID、题名和数量。例如“神经退行性疾病”继续对应帕金森病、阿尔茨海默病、亨廷顿病、ALS 和 tau 蛋白病。
- 实验标签：胚胎/幼体/成鱼、CRISPR、转基因、活体成像、单细胞组学、高通量、行为学，以及存活、畸形、心率、ROS 等观察终点。

每篇论文允许多个研究目的、系统和专题，但分别选出一个主要研究目的和主要生物系统。三级专题必须由四级详细词汇触发；论文中实际命中的同义词也会保留为分类依据。完整词库位于 `scripts/topic-vocabulary.mjs`，分类逻辑位于 `scripts/taxonomy-v2.mjs`。

## 关于验证码

本项目不提供验证码绕过。知网若对批量访问弹出安全验证，应停止网页采集并保留断点。官方批量导出加本地解析，是当前最稳定的低验证码方案；逐篇目录仍取决于公开详情页、已下载全文或用户已有访问权限。
