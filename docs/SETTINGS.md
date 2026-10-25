# 设置与配置

- 语言偏好：localStorage `gw2-raids-language`，值 `zh` 或 `en`；存储受限时仍可切换。
- 日期：UTC；每日北京时间 08:00 刷新。手动日期只保留在当前页面会话，回到今天恢复自动跟随。
- 碎层资料：`src/data/fractals/meta.json` 保存提交、日期、build 及许可；CM 在 `challenge-modes.json` 按关卡配置。
- 中文资料：团队悬赏 `src/data/raid-names-zh.json`；碎层 `src/data/fractals/names-zh.json`。
- 官方中文同步：`npm run names:update`；只校验用 `-- --dry-run`。公开成就查询无需 API 密钥。来源和边界见 [DATA_SOURCES.md](DATA_SOURCES.md)。
- Git：更新脚本支持环境变量 `GIT_BINARY` 指定 Git 可执行文件；也可通过完整提交 SHA 更新而不调用 Git。
- 本地：`npm run dev`。生产预览：`npm run build` 后 `npm run preview`。
- GitHub Pages：Source 选择 GitHub Actions，工作流生成并上传 `dist/`。
