# GW2 Raid Bounties — 激战2日常十人本查询

纯静态网站，无需后端、数据库、构建步骤或外部图片服务。

## 当前功能

- 首页展示当天四组 Boss 与所属副本；每天 UTC 00:00（北京时间 08:00）自动刷新。
- 选择任意有效日期，查看并复制当天的四项日常。指定日期固定保留，点击“回到今天”恢复跟随当前 UTC 日期。
- “截图分享”生成所选日期的高清 PNG，带日期、轮换序号、全部四个 Boss 及副本名称。
- 循环表的“整表截图分享”生成当前整轮 12 天的完整 PNG，包含全部 48 个目标、悬赏名称和日期；今天会高亮。
- 图片先预览，可保存 PNG。浏览器支持文件分享时，预览中额外显示“分享图片”，通过单独点击打开系统分享菜单。
- 全局中英文切换；界面、名字、复制内容与分享图跟随当前语言。浏览器会记住语言选择。
- 七天展开预告已删除。

## 分享图片

1. 在首页选日期，或保持默认的今天，点击“截图分享”。
2. 查看预览后选择“保存 PNG 图片”或“分享图片”。
3. 分享整轮安排时，打开“12天循环表”，点击“整表截图分享”。

PNG 在浏览器本地使用 Canvas 绘制，不需要将日常数据上传至第三方截图服务。图片宽度固定为单日 1100px、整表 1800px，高度按内容自动计算；完整长表不依赖手机屏幕可见区域。

系统分享取决于浏览器的 Web Share 文件支持（通常需 HTTPS 和用户点击）。不支持时仍可保存 PNG；部分手机可能在新页面打开图片，此时可长按保存。取消系统分享后，预览和保存入口仍保留。

## 文件结构

- `index.html`：首页、日期选择、文字复制和单日图片分享。
- `rotation.html`：完整12天循环表与整表图片分享。
- `assets/js/data.js`：36项英文遭遇战数据及轮换顺序。
- `assets/js/rotation.js`：UTC 日期与轮换计算。
- `assets/js/encounters-zh.js`：中文名称。
- `assets/js/i18n.js`：全站双语文案与语言选择。
- `assets/js/app.js`：页面渲染、指定日期、刷新及复制。
- `assets/js/share-image.js`：分享模型、Canvas PNG 绘制、预览、保存和系统分享。
- `assets/css/styles.css`、`today.css`、`share.css`：全站、首页与分享界面样式。
- `docs/translations.md`：名称来源、已修正译名及核验限制。

## 本地预览及 GitHub Pages

双击 `index.html` 即可打开，也可进入项目目录运行 `python -m http.server 8000`，访问 http://localhost:8000/。

GitHub Pages：在仓库 `Settings → Pages` 中选择 `Deploy from a branch`、`main`、`/(root)` 并保存。文件应直接放在仓库根目录；`.nojekyll` 用于禁用 Jekyll。

## 日期和名称说明

- 锚点：2026-10-15 UTC 为周期第1天；四组长度分别为6、12、12、6，完整组合12天重复。
- 默认日期使用 UTC；设备时间应准确。日期选择器同样按 UTC 日期查询。
- 数据静态计算，未连接游戏 API；未来游戏轮换规则改变时需更新 `data.js`。
- 英文数据参考 [GW2 Wiki](https://wiki.guildwars2.com/wiki/Daily_Raid_Bounties)。中文采用用户提供的名称数据库及可检索 Wiki 对照修正；来源、未确认项与直连限制见 `docs/translations.md`。缺失中文回退英文。
- 此站为非官方玩家工具，与 ArenaNet 无关。

## 验证

安装 Node.js 18+ 后执行：

```sh
node --test tests/test-rotation.cjs tests/test-homepage.cjs tests/test-share-image.cjs
```

测试覆盖轮换、跨UTC日、日期选择及固定、无效日期、双语复制、语言偏好、分享图片的日期/完整48项目、长名称换行、图片生成失败、系统分享取消与旧预览资源清理。

本次另外使用本地 Canvas 实际生成并目视检查了中英文单日图与整表 PNG。真实浏览器页面布局和手机系统分享菜单未在当前环境实机验证。
