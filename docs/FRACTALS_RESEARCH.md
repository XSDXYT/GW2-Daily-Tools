# 碎层异变项目研究与修复

研究日期：2026-10-25。参考项目：[XSDXYT/GW2-Fractals-Instabilities-Find](https://github.com/XSDXYT/GW2-Fractals-Instabilities-Find)，本次读取提交 `beb3035`。

## 原项目原理及问题

`index.html` 读取 `fractals.json` 的层数→关卡映射、`instabilities.json` 的层数→366 天异变表，以及 `zh_dict.json`。页面取三个异变 ID，通过数组下标解析名称。这些 ID 是资料内部索引，不能与技能、成就或 EVTC ID 混用，尤其不能把 `0` 当作空值。

主要缺陷：

1. 日期用 `(查询日期 - 2023-12-31) mod 366`，误把年内日历表当作连续循环。
2. CM 写死 `[95,96,97,98,99,100]`，遗漏新增的 94 层挑战模式。
3. 关卡映射及部分层数异变表未跟随 2026-09-15 的重排更新。
4. `dashboard.html` 只支持按日期映射或带 startDate 的 rotation，无法解析仓库实际提供的 `instabilities[scale][index]`，并错误假定所有 CM 共享同一组异变。

## 核验到的当前来源

- [ArenaNet：Code of Creation 预告](https://www.guildwars2.com/en/news/code-of-creation-concludes-visions-of-eternity-on-september-15/)：Solitary Throne 于 2026-09-15 发布，挑战模式于 2026-09-29 开放。
- [ArenaNet：更新上线说明](https://www.guildwars2.com/en/news/play-the-finale-of-visions-of-eternity-today-with-code-of-creation/)：确认新碎层上线。
- [Invisi 上游 README](https://github.com/Invisi/gw2-fotm-instabilities/blob/e7bef51e999609d5ee65ca0a1c96a65a0142185f/README.md)：明确固定闰年日历索引，平年跳过索引 59。
- [该版本关卡映射](https://github.com/Invisi/gw2-fotm-instabilities/blob/e7bef51e999609d5ee65ca0a1c96a65a0142185f/fractals.json)：Solitary Throne 位于 19、44、64、94；原 94 层 Cliffside 等关卡发生重排。
- [该版本异变表](https://github.com/Invisi/gw2-fotm-instabilities/blob/e7bef51e999609d5ee65ca0a1c96a65a0142185f/instabilities.json)：26–100 层的 366 天资料。原项目与该版本的 T4 异变表在 89–94 层存在变化。

资料版本：上游 `e7bef51e999609d5ee65ca0a1c96a65a0142185f`，游戏 build 207032 / 2026-09-15。上游资料按 CC BY-NC 4.0 发布，页面及仓库均保留署名与许可。

中文资料后续补充：2026-10-25 已通过官方成就 API 的中英文同 ID 对照核对全部 25 个碎层名称，Solitary Throne 显示为“孤独王座”。异变译名仍保留社区来源，不能将 EVTC ID 直接当成 API 技能 ID。完整证据与同步方法见 [DATA_SOURCES.md](DATA_SOURCES.md)。

## 修复算法

以查询日期的 UTC 月、日映射到 2024 年（任意完整闰年均可）：

```ts
index = (Date.UTC(2024, month - 1, day) - Date.UTC(2024, 0, 1)) / 86400000;
instabilityIds = instabilities[String(scale)][index];
```

1 月 1 日为 0，2 月 28 日为 58，2 月 29 日为 59，3 月 1 日始终为 60，12 月 31 日为 365。平年没有 2 月 29 日，因此自然跳过 59。1 月 1 日重新从 0 查询。

日常和推荐碎层依照同一上游说明，用该索引模各自的 15 项轮换表。T1 无异变，T2/T3/T4 分别有 1/2/3 个异变。

CM 配置记录关卡 slug 与开放状态，再取该关卡当前最高层数；新增关卡不再由一段固定数字判断是否 CM。当前 7 个 CM：94 Solitary Throne、95 Kinfall、96 Nightmare、97 Shattered Observatory、98 Sunqua Peak、99 Silent Surf、100 Lonely Tower。

例如 2026-10-25 应使用索引 298：94 层为 `[15,7,10]`，95 层为 `[7,0,1]`。原固定锚点算法会查询 297，产生错位。测试使用固定上游样例验证，而非仅检查自身计算结果。

## 已实现与边界

- 日期查询、CM/T4 日常/T1–T4、名称或层数搜索、异变筛选、复制结果；日期反查仅支持全部／指定 CM，可查询 1–366 天。
- 使用 UTC 日期，今天跟随每日北京时间 08:00 刷新；手动选择固定日期。
- 本地打包资料，运行时无需第三方数据请求；更新失败不会以旧表伪装实时资料。
- 2026-09-15 以前不套用此版本，防止重排后的表被误用于历史版本。
- 新的上游提交需同时提供对应游戏版本日期/build；更新脚本完整校验后写入。新增关卡的 CM 开放状态和中文名仍需核对。
- 数据未在游戏客户端实机逐项验证；国服若存在与国际服不同的更新进度，需要另建带版本的资料集，不能仅修改日期锚点。
- 本次 GW2 Wiki 返回维护页面，未将其作为已成功核验的证据。搜索连接器不可用，使用官网与 Git 仓库直接核查。
