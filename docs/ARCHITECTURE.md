# 架构与技术选型

当前：Vue 3.5 + TypeScript 5.9 + Vite 8，无后端、数据库或游戏 API 密钥。Node.js 推荐 24。

- `index.html` / `rotation.html` / `fractals.html`：保留静态多页地址，共用 Vue 入口。
- `src/App.vue`：页面壳、导航、标题及页脚。
- `src/components/`：团队悬赏、碎层、日期控制、图片分享；共享头部使用统一 CSS 吸顶。
- `src/domain/dates.ts`：UTC 校验、跨日及碎层闰年日历索引。
- `src/domain/raids.ts`：原 12 天团队悬赏规则。
- `src/domain/fractals.ts`：独立的碎层映射、异变、日常、CM 和反查规则。
- `src/data/`：英文资料、中文映射、双语文案；碎层版本及许可可追溯。
- `src/lib/share.ts`：有类型的分享/复制模型。Canvas 绘制逻辑保留为独立 ES module `canvas-renderer.js`，用声明文件描述接口。
- `src/i18n.ts`：响应式语言状态，沿用原 localStorage 键以保留用户偏好。
- `scripts/`：碎层资料下载及结构校验。
- `scripts/update-localization.mjs`：官方中英文成就的身份核验与本地中文更新；来源记录独立保存，不给页面添加运行时网络依赖。

使用多页构建以兼容既有链接和静态托管；当前没有引入路由库、全局状态库和服务端渲染的需求。业务算法与 Vue 组件分离，测试无需浏览器或网络。

`npm run build` 先检查类型，再生成 `dist/`，资源路径使用相对 base 支持 GitHub 仓库子路径。GitHub Pages 通过 Actions 构建后部署，不能继续直接发布源码根目录。

Pages 部署后续检查：`scripts/check-pages.mjs` 验证三个构建入口及本地资源在仓库子路径下的解析，工作流构建后执行。`src/lib/site-url.ts` 从实际页面 URL 推导分享图片中的站点目录，避免依赖旧仓库名；无 HTTP(S) 页面地址时使用工具名称作为页脚。
