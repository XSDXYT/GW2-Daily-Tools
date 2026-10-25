# 资料来源与中文核验

更新日期：2026-10-25。按用户要求，将官方 API 与官方英文 Wiki 纳入后续研究的固定资料入口。

## 官方 API：现在可用

入口：<https://api.guildwars2.com/v2>。入口本身返回纯文本说明，列出路由、本地化标记和认证要求，不是 JSON 数据列表。

支持本地化的接口可附加 `lang=zh`；本项目同时读取 `lang=en`，确认同一资源 ID 的英文身份后使用中文文本。公开名称查询无需 API 密钥。

本次实际使用：

- `/achievements`：25 个碎层的 T4 日常成就、36 项 Raid Bounty 成就。
- `/achievements/categories?ids=all&lang=en`：发现 Daily Fractals（88）和 Daily Raid Bounties（475）分类。分类中的日常条目可能随当天轮换，不应据此认定完整资源只剩几个。
- `/skills`：返回 4763 个公开技能 ID；本项目 18 个异变的 EVTC ID 均未在此列表中出现。
- `/raids?ids=all&lang=zh`：返回关卡/事件结构 ID，未返回可直接用于本项目的中文 Boss 全名。

当前已保存：

- **25 个碎层中文名**，来自同 ID 的中英文日常成就。移除“日常”和“4级”后得到名称；兼容“日常孤独王座4级”和“日常4级寂静之浪”两种格式。
- **36 个悬赏中文任务名**，移除“大型地下城赏金：”。仅当原始英文副本名与任务目标完全相同，才一并更新副本字段。
- 每项来源 ID、原始中英文成就名和查询链接保存在 `src/data/official-name-sources.json`；Raid Bounty 的已核对 ID 在 `src/data/raid-bounty-api-ids.json`。

示例：[9388 英文](https://api.guildwars2.com/v2/achievements/9388?lang=en)、[9388 中文](https://api.guildwars2.com/v2/achievements/9388?lang=zh) 对应 Solitary Throne / 日常孤独王座4级，因此显示“孤独王座”。[9109 中文](https://api.guildwars2.com/v2/achievements/9109?lang=zh) 提供悬赏短名“凯玲”，不表示 NPC 全名必须缩写；原有 Boss 全名“不屈的凯玲”保留。

同步：

```sh
npm run names:update
npm run names:update -- --dry-run
```

命令根据现有资料 ID 批量获取中英文成就。全部身份、响应完整性及中文格式通过核验后才替换本地映射；网络失败、缺项、英文身份变化或缺少中文时停止，不覆盖现有名称。运行时仍读取打包后的本地资料，不依赖 API 在线状态。

新增团队悬赏时需先核对成就 ID，再更新 `raid-bounty-api-ids.json`。碎层使用上游映射内的日常成就 ID，随新关卡资料扩展。

## 官方英文 Wiki：维护期间作为待恢复来源

入口：<https://wiki.guildwars2.com/wiki/Main_Page>。当前用户反馈和本项目先前访问均为维护状态。恢复后用于核对实体关系、机制、轮换变化、名称及来源链接；维护页面不算已成功读取条目，也不把搜索摘要等同于官方中文客户端文本。

后续数据研究优先检查官方 API 和 Wiki，再使用可追溯的社区数据及更新公告。无需为了名称同步重复抓取维护中的 Wiki；恢复访问后按具体研究需要查询。

## 不同资料的边界

- 成就 ID、技能 ID、地图 ID、EVTC ID、社区异变数组索引是不同标识体系，不能只因数字相同就直接互换。
- 官方悬赏短名和 Boss 全名分字段保存；复合 Boss 不从单个成就名称猜测补全。
- 当前异变中文仍来自原项目，未标记为 API 已核验。
- API 入口没有提供本项目所需的完整每日异变预测表；现阶段继续使用 Invisi 的带版本资料及许可。中文核验不会改变异变日期算法或轮换。
