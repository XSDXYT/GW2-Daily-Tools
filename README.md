# GW2 Daily Tools — 激战2日常工具集

Vue 3 + TypeScript + Vite 开发的静态工具集，包含每日团队悬赏、12 天轮换表和碎层异变查询。无需后端、数据库或游戏 API 密钥。

## 运行

需要 Node.js 22.12+（推荐 24）和 npm。

```sh
npm ci
npm run dev
```

按终端给出的本地地址访问。迁移后需要通过开发服务器预览，不能直接双击 HTML。原有 `index.html`、`rotation.html` 地址保留，新增 `fractals.html`。

```sh
npm run build
npm run preview
```

生产文件生成在 `dist/`；可以部署到 GitHub Pages 或其他静态托管，支持仓库子路径。

## 功能

- 今日日常：分为十人本悬赏与碎层两块，展示四组 Boss、全部已开放 CM、3 个 T4 日常及 3 个推荐碎层；复制文字和高清 PNG 均包含两个板块。
- 首页碎层展示准确层数、建议抗性及当日异变，推荐保持任务指定的 T1/T2/T3 层数；CM 与 T4 日常重合时显示标记。全页共用 UTC 日期及语言选择。
- 完整 12 天轮换：桌面表格、手机卡片、定位今天、整轮 PNG 分享。
- 碎层：7 个挑战模式、T4 日常、T1–T4 查询、名称/层数搜索、异变筛选、复制结果及组合条件日期反查。
- 全站中英文切换及语言偏好保存，共享吸顶导航。
- 所有日期按 UTC 计算，每天北京时间 08:00 刷新；手动选定的日期保持固定。
- 首页轮换进度位于“十人本悬赏”标题旁；刷新倒计时使用醒目的大字和描边。

## 碎层日期反查

异变反查默认收起，点击展开后才加载查询；收起时暂停计算，再次展开保留当前筛选。仅反查挑战模式。可查询全部 CM，或多选指定 CM 关卡；未选择关卡时表示全部。查询从页面上方选定的日期开始，包含当天，支持 7/30/90/180/366 天快捷范围及 1–366 天自定义。

| 需求 | 条件示例 |
| :--- | :--- |
| 找单个 CM 的指定组合 | 选择 CM 关卡，添加多个“包含”异变，选择“同一关卡包含全部” |
| 避开不喜欢的异变 | 将异变加入“排除”，可同时排除多个 |
| 找适合打全部 CM 的日期 | 保持全部 CM，选择“整组关卡全部符合”，设置排除异变 |
| 给多个 CM 安排共同日期 | 多选 CM 关卡，选择“整组关卡全部符合” |
| 按现有装备找可打的 CM | 填写“我的抗性上限”，查询全部或指定 CM |

“包含全部”和“包含任意一个”都在**同一关卡**内判断；排除异变一律不可出现。“整组关卡全部符合”要求每个指定 CM 均已开放并满足异变和抗性条件。结果显示完整异变和匹配数，分页浏览；“复制全部匹配”包含所有页及筛选条件。

针对性验证：`npm run test:fractal-search`。

## 碎层修复与资料范围

已同步 Invisi 上游 `e7bef51e999609d5ee65ca0a1c96a65a0142185f`（游戏版本 207032 / 2026-09-15），包含 19/44/64/94 层 Solitary Throne；其 94 层挑战模式自 2026-09-29 开放。

异变表采用固定闰年日历的 0–365 索引，平年跳过 2 月 29 日；不是从固定锚点连续循环 366 天。挑战模式以关卡身份及开放日期配置，再查找当前最高层数，不再写死 95–100。

这是基于社区资料的预测，不是游戏实时接口，也未在游戏客户端逐项核对。当前资料不提供 2026-09-15 以前的旧版本查询；未来规则变化后需更新。未确认的中文名称保留英文。

现已使用官方 API 的 `lang=en/zh` 对照，核对 25 个碎层中文名和全部 36 项悬赏任务名，包括“孤独王座”。每项原文、ID 与链接保存在 `src/data/official-name-sources.json`；异变译名和 Boss 全名保持独立来源。

```sh
npm run names:update
npm run names:update -- --dry-run
npm run test:localization
```

官方 API 与 Wiki 的后续核验约定见 [DATA_SOURCES.md](docs/DATA_SOURCES.md)。Wiki 当前维护，恢复后再用于补充核对。

## 更新碎层资料

```sh
npm run data:update
# 新的上游提交必须同时指定对应游戏更新日期和 build：
npm run data:update -- <完整上游提交SHA> <YYYY-MM-DD> <游戏build>
# 只下载并校验，不替换本地文件：在上述命令后追加 --dry-run
```

默认通过 Git 读取上游最新提交，也可以直接传入完整提交 SHA。下载四份资料并校验全部层数、异变数量、闰年日历表及日常轮换后再替换本地文件。新关卡的挑战模式开放情况与中文名需要人工核对，配置位于 `src/data/fractals/challenge-modes.json` 和 `names-zh.json`。Windows 便携 Git 可通过 `GIT_BINARY` 环境变量指定。

## 针对性验证

```sh
npm run test:domain
npm run typecheck
```

测试覆盖本次新增和迁移涉及的日期算法、碎层资料、挑战模式开放、固定上游样例、异变反查、原有团队悬赏及 PNG 绘制模型。只验收修改及直接影响范围，不默认运行全量端到端测试。

## GitHub Pages

目标仓库：[XSDXYT/GW2-Daily-Tools](https://github.com/XSDXYT/GW2-Daily-Tools)。站点地址：<https://xsdxyt.github.io/GW2-Daily-Tools/>。

1. 仓库 `Settings → Pages → Build and deployment → Source` 选择 **GitHub Actions**。
2. 上传当前项目源码及 `.github/workflows/deploy.yml`，保留 `package.json`、`package-lock.json`、`src/`、`assets/`、三个 HTML 入口和配置文件；不上传 `node_modules/`、本机运行环境或 `dist/`。
3. 更新 `main` 后，工作流安装依赖、构建、检查资源子路径，然后发布 `dist/`。也可在 `Actions → Deploy GW2 Daily Tools → Run workflow` 手动运行。
4. 等工作流成功后访问站点；不要把源码根目录直接作为静态成品发布。如果线上 HTML 仍引用 `/src/main.ts`，说明线上尚未使用构建产物。

资源采用相对路径，三个页面支持仓库子目录；无需把 Vite 的 base 写死为仓库名。分享图片页脚从实际访问地址获取站点目录，已移除旧仓库网址，后续改名或绑定自定义域名可自动适配。

本地部署检查：

```sh
npm run test:deployment
npm run build
npm run check:pages
```

`check:pages` 检查三个构建入口是否使用 JavaScript 产物，以及脚本、样式、图标和 CSS 图片能否在 `/GW2-Daily-Tools/` 子路径下解析；同一检查已加入发布工作流。

## 文档与来源

文档索引见 [AGENTS.md](AGENTS.md)。实现研究、证据、日期算法及限制见 [碎层研究](docs/FRACTALS_RESEARCH.md)，架构见 [ARCHITECTURE.md](docs/ARCHITECTURE.md)。

碎层资料来自 [Invisi/gw2-fotm-instabilities](https://github.com/Invisi/gw2-fotm-instabilities)，按 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 使用；详情见 [第三方资料说明](THIRD_PARTY_NOTICES.md)。此许可针对引用的数据，不自动覆盖本项目全部代码。本项目是非官方玩家工具。
