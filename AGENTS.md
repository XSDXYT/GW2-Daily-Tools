# 项目文档

docs/ 内为项目文档
这里建立索引表，当项目文档内添加新文档时，这里要同步更新索引

| 文档 | 文档信息 | 路径 |
| :--- | :--- | :--- |
| README.md | 项目介绍、安装运行及构建部署。 | [README.md](README.md) |
| AGENTS.md | 项目文档索引与维护要求。 | [AGENTS.md](AGENTS.md) |
| ARCHITECTURE.md | 当前架构与 Vue/TypeScript/Vite 选型。 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| DESIGN.md | 视觉风格和核心交互。 | [docs/DESIGN.md](docs/DESIGN.md) |
| SETTINGS.md | 设置、资料配置与部署。 | [docs/SETTINGS.md](docs/SETTINGS.md) |
| REQUIREMENTS.md | 用户需求与功能清单。 | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) |
| TASKS.md | 已完成工作、后续维护与阶段边界。 | [docs/TASKS.md](docs/TASKS.md) |
| HANDOFF.md | 阶段交接，供新会话继续工作。 | [docs/HANDOFF.md](docs/HANDOFF.md) |
| FRACTALS_RESEARCH.md | 碎层原项目原理、修复算法、来源与限制。 | [docs/FRACTALS_RESEARCH.md](docs/FRACTALS_RESEARCH.md) |
| DATA_SOURCES.md | 官方 API、Wiki 与中文名称的核验及同步规则。 | [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) |
| translations.md | 团队悬赏中文名称来源与核验范围。 | [docs/translations.md](docs/translations.md) |
| translation-sources.json | 中文名称修正证据。 | [docs/translation-sources.json](docs/translation-sources.json) |
| THIRD_PARTY_NOTICES.md | 碎层数据许可及第三方署名。 | [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) |

# 资料来源约定

涉及游戏数据或中文名称时先读取 [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)。优先使用官方 API `https://api.guildwars2.com/v2` 的中英文同 ID 对照；官方英文 Wiki 恢复后用于补充核验。保留来源 ID、原文、核对日期及未确认项，不混用不同标识体系，也不把悬赏短名覆盖为 Boss 全名。

# 增量测试与最小化验收原则

每次完成代码开发、功能修改或 Bug 修复后，必须遵循以下测试与验收规则：

## 1. 测试范围
- 只测试本次新增、修改或修复的功能，以及直接受影响的代码。
- 优先执行与本次变更相关的单元测试、模块测试或针对性功能测试。
- 如修改涉及模块间接口、数据结构或依赖关系，仅补充必要的关联测试。
- 不得默认执行整个项目的完整测试、全量回归测试或端到端测试。

## 2. 最小化执行
- 根据本次代码差异（Diff）确定最小必要测试范围。
- 优先使用精准的测试命令，避免不必要的全项目构建、扫描和重复测试。
- 已通过且未受到本次修改影响的测试，不需要重新执行。
- 不得为了提高测试覆盖率而主动扩大验收范围。

## 3. 验收标准
- 本次功能符合需求和预期行为。
- 本次修改涉及的必要测试通过。
- 无明显编译错误、运行错误或直接关联的功能回归。
- 满足以上条件即可结束本次验收，不继续扩展测试范围。

## 4. 特殊情况
仅在以下情况允许扩大测试范围：
- 修改了公共接口、共享组件或核心依赖，可能影响其他功能。
- 相关测试发现异常，需要进一步定位问题。
- 当前修改无法通过局部测试可靠验证。
- 用户明确要求完整测试或全面验收。

扩大测试范围前，应说明原因及计划执行的测试内容。除定位当前问题所必需的测试外，未经用户批准，不执行全项目测试。

## 5. 结果报告
完成测试后，简要报告：
- 本次测试覆盖的功能。
- 实际执行的测试命令及结果。
- 未执行的全量测试（如适用）。
- 是否达到本次功能的验收标准。

**核心原则：只验证本次变更及必要影响范围，以最小测试成本获得足够的验收信心。禁止无理由扩大测试范围。**
