# AGENTS.md

本文件约束 AI 助手在本仓库中的工作方式。核心目标：**用最少的操作量完成任务**，不要为了让 AI 自己"安心"而执行用户没有要求、也不会改变结论的动作。

规则只在会话开始时加载，修改后需新建对话才会生效。

---

## 一、不要启动任何长期运行的服务

- 禁止执行 `pnpm dev`、`pnpm tauri:dev`、`pnpm preview` 或任何会常驻不退出的命令。
- 用户通常已经开着自己的 dev server。Vite 配置了 `strictPort: 1420`，重复启动只会因端口占用而失败，还可能留下僵尸进程、阻塞用户后续的 `tauri:dev`。
- 前端改动由 Vite HMR 自动生效，用户切回窗口就能看到结果，**不需要 AI 代为重启或"跑一遍看看"**。

## 二、不要为了"亲眼验证"引入重型依赖

- 不要安装浏览器自动化工具（agent-browser、playwright 等）、不要下载 Chromium、不要安装新的全局 CLI。
- 对于无法直接观测的效果（CSS 布局、渲染结果、窗口交互），**说明验证范围与置信度即可**，把最终确认交给用户。
- 不要为了验证一个小改动而搭建脚手架、临时入口或测试工程。

## 三、不要重复执行已经通过的检查

- `pnpm typecheck`、`pnpm lint`、`pnpm build` 在一轮改动后**跑一次即可**，不要在"修完问题后再确认一下"时重跑第二遍。
- 只改 CSS、Markdown、注释或纯静态资源时，不需要跑 `pnpm build`。
- 不要为同一目的换不同命令反复验证（例如既跑 `pnpm build` 又跑 `pnpm typecheck`，前者已包含后者）。

## 四、不要主动执行 Git 写操作

- 未经用户明确要求，不要 `git add`、`git commit`、`git push`。
- 任何时候都不要执行 `git reset --hard`、`git push --force`、`git clean -fd`、`git checkout -- .`。
- 不要修改 Git 配置或提交钩子。

## 五、不要污染工作区

- 不新建临时脚本、日志、调试文件；确有必要时，任务结束前必须删除。
- 命令输出不要重定向到仓库内，用 `$env:TEMP`。
- 不要为了让 diff 干净而修改 `.gitignore`、`.prettierignore` 去掩盖新产生的文件。
- 不要删除 `.codebuddy/` 目录。

## 六、标准操作对照表

| 场景               | 应当执行                                           |
| ------------------ | -------------------------------------------------- |
| 改完前端代码       | 跑一次 `pnpm typecheck` + `pnpm lint`              |
| 改了构建配置或依赖 | 跑一次 `pnpm build`                                |
| 改了 Rust 代码     | 在 `src-tauri` 下跑 `cargo check`（首次约 2 分钟） |
| 只改了 CSS / 文档  | 不跑构建，说明改了哪些规则即可                     |
| 需要看运行效果     | 交由用户，不自行启动服务                           |
| 需要提交代码       | 等用户明确要求                                     |

---

## 七、项目约定速查

- **包管理器**：pnpm，不要使用 npm / yarn。
- **路径别名**：`@/` → `src/`。
- **工具注册**：`src/tools/registry.ts` 通过 `import.meta.glob("./*/index.tsx")` 自动发现工具。注意 `import.meta.glob` 返回的是模块命名空间对象，工具数据位于 `default` 上。
- **新增工具**：在 `src/tools/<id>/index.tsx` 中**默认导出** `{ meta, component }`（`satisfies ToolModule`），无需修改任何注册文件。
- **后端命令**：写在 `src-tauri/src/commands/` 对应领域模块中，在 `src-tauri/src/lib.rs` 的 `generate_handler!` 登记，统一返回 `AppResult<T>`。
- **样式**：颜色、间距、圆角一律使用 `src/styles/tokens.css` 中的 CSS 变量，不硬编码数值。样式分层为 tokens → base → layout → components → tools → overlays → pages。
- **IPC**：前端所有原生调用必须经过 `@/lib/ipc` 的 `call()`，不要直接使用 `invoke`。
- **主题**：切换 `html[data-theme]`，深色为默认值。

## 八、沟通约定

- 使用简体中文回复。
- 说明**改了什么、为什么改、验证到什么程度**，不要用"已完成"掩盖未验证的部分。
- 无法验证时直接说明，并给出用户可自行执行的确认步骤。
- 遇到需要用户决策的点（如是否提交、是否删除文件），先问再做。
