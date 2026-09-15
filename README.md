# omni-toolbox · 万象工具箱

万象工具箱是我个人的多用途工具集合，用来收纳日常开发、学习与折腾中沉淀下来的各种脚本和实用工具。这里可能包含文本处理、编码转换、文件/图片操作、网络调试、系统维护、效率自动化等各类功能；每个工具尽量保持独立、简单、开箱即用。项目通过 GitHub 持续维护，既作为我的数字瑞士军刀，也希望能给偶然路过的你带来一点便利。

桌面端基于 **Tauri 2 + React 19 + TypeScript + pnpm** 构建，核心设计是**可插拔的工具系统**：新增一个工具只需要新建一个目录，导航、路由、搜索、命令面板会自动识别，无需修改任何中心化配置文件。

## 技术栈

| 层       | 选型                                        |
| -------- | ------------------------------------------- |
| 桌面外壳 | Tauri 2                                     |
| 前端框架 | React 19 + TypeScript                       |
| 构建工具 | Vite 8                                      |
| 路由     | React Router 7（HashRouter）                |
| 状态管理 | Zustand 5（含持久化）                       |
| 图标     | lucide-react                                |
| 样式     | Tailwind CSS v4（设计令牌经 `@theme` 映射） |
| 后端     | Rust（Tauri commands）                      |
| 包管理器 | pnpm                                        |

## 环境要求

- Node.js >= 20
- pnpm >= 9
- Rust >= 1.77（含 `cargo`）
- Windows 需安装 [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)（Win11 已内置）

## 快速开始

```bash
pnpm install          # 安装前端依赖
pnpm tauri:dev        # 启动桌面端（自动拉起 Vite 并编译 Rust）
pnpm dev              # 仅启动前端（浏览器预览，原生能力不可用）
pnpm tauri:build      # 打包可分发安装包
```

其他脚本：

```bash
pnpm build            # 类型检查 + 前端生产构建
pnpm typecheck        # 仅类型检查
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm format           # Prettier 格式化
```

## 目录结构

```
omni-toolbox/
├─ src/                          # 前端
│  ├─ App.tsx                    # 路由与全局 Provider
│  ├─ main.tsx                   # 挂载入口
│  ├─ components/
│  │  ├─ layout/                 # AppShell / Sidebar / TopBar
│  │  └─ ui/                     # Button / Input / Panel / Feedback …（统一从 index.ts 导出）
│  ├─ config/app.ts              # 应用级常量
│  ├─ features/                  # 跨工具的业务能力
│  │  ├─ command-palette/        # Ctrl+K 命令面板
│  │  ├─ favorites/              # 收藏
│  │  ├─ history/                # 最近使用
│  │  ├─ settings/               # 界面偏好
│  │  ├─ theme/                  # 主题（深色 / 浅色 / 跟随系统）
│  │  └─ toast/                  # 全局提示
│  ├─ hooks/                     # 通用 Hook（useCopy …）
│  ├─ lib/                       # 基础设施
│  │  ├─ ipc.ts                  # invoke 封装 + 统一错误（call / toMessage）
│  │  ├─ clipboard.ts            # 剪贴板读写
│  │  ├─ storage.ts              # 本地持久化
│  │  └─ cn.ts                   # 类名合并
│  ├─ pages/                     # 首页 / 设置 / 关于 / 404
│  ├─ styles/                    # Tailwind 入口与设计令牌（index / tokens / base / tools）
│  └─ tools/                     # ★ 工具集合（自动注册）
│     ├─ types.ts                # ToolMeta / ToolModule 契约
│     ├─ registry.ts             # import.meta.glob 自动发现与路由生成
│     └─ <tool-id>/index.tsx     # 单个工具
└─ src-tauri/                    # 后端
   ├─ src/
   │  ├─ lib.rs                  # Builder 装配与命令登记
   │  ├─ error.rs                # AppError / AppResult（统一错误形态）
   │  ├─ state.rs                # 跨命令共享状态
   │  └─ commands/               # 命令层，按领域拆分
   │     ├─ crypto.rs            # 摘要计算
   │     ├─ generator.rs         # UUID 生成
   │     └─ system.rs            # 系统信息
   ├─ capabilities/              # 权限声明
   └─ tauri.conf.json            # 窗口、打包配置
```

## 新增一个工具

1. 新建目录 `src/tools/my-tool/index.tsx`：

```tsx
import { Wrench } from "lucide-react";
import { useState } from "react";

import { Panel, PanelBody, PanelHead } from "@/components/ui";
import type { ToolModule } from "@/tools/types";

function MyTool() {
  const [value, setValue] = useState("");
  return (
    <div className="ot-workspace ot-workspace--split">
      <Panel>
        <PanelHead title="输入" icon={<Wrench size={14} />} />
        <PanelBody>{/* … */}</PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "my-tool", // 唯一标识，同时是路由片段 /tool/my-tool
    name: "我的工具",
    description: "一句话说明这个工具做什么",
    category: "dev", // text | encode | crypto | time | dev | system
    icon: Wrench,
    keywords: ["关键词"], // 供搜索使用
    order: 100, // 排序权重，越小越靠前
  },
  component: MyTool,
} satisfies ToolModule;
```

保存后即可在侧边栏、首页、命令面板中看到它，**无需改动任何注册文件**。

2. 常用布局类（定义于 `src/styles/tools.css`）：

| 类名                        | 用途                         |
| --------------------------- | ---------------------------- |
| `ot-workspace`              | 工具页根容器，撑满内容区     |
| `ot-workspace--split`       | 左右等分两栏                 |
| `ot-workspace--wide-left`   | 左宽右窄两栏                 |
| `ot-stack`                  | 纵向堆叠区块                 |
| `ot-code`                   | 等宽代码 / 输出区            |
| `ot-stats` / `ot-stat`      | 指标卡片组                   |
| `ot-kv`                     | 键值对列表                   |
| `ot-list`                   | 结果列表（含序号与复制按钮） |
| `ot-options` / `ot-option`  | 表单选项行                   |
| `ot-swatches` / `ot-swatch` | 色板                         |

## 新增一个后端命令

1. 在 `src-tauri/src/commands/` 对应领域模块中编写命令：

```rust
use crate::error::{AppError, AppResult};

#[tauri::command]
pub fn my_command(input: String) -> AppResult<String> {
    if input.is_empty() {
        return Err(AppError::invalid("输入不能为空"));
    }
    Ok(input.to_uppercase())
}
```

2. 在 `src-tauri/src/lib.rs` 的 `generate_handler!` 中登记：

```rust
.invoke_handler(tauri::generate_handler![
    commands::crypto::hash_text,
    commands::generator::generate_uuids,
    commands::system::system_info,
    commands::my_domain::my_command, // ← 新增
])
```

3. 前端通过统一入口调用，错误会自动转成可展示文案：

```ts
import { call, toMessage } from "@/lib/ipc";

try {
  const result = await call<string>("my_command", { input: "hello" });
} catch (error) {
  console.error(toMessage(error));
}
```

> 约定：命令一律返回 `AppResult<T>`，错误经 `Serialize` 变成字符串抛给前端，`lib/ipc.ts` 会包装为 `IpcError`。

## 内置工具

| 分类       | 工具                            | 实现 |
| ---------- | ------------------------------- | ---- |
| 文本处理   | 命名风格转换                    | 前端 |
| 编码转换   | Base64 编解码、URL 编解码       | 前端 |
| 加密与摘要 | 哈希摘要、UUID 生成器           | Rust |
| 时间与日期 | 时间戳转换                      | 前端 |
| 开发辅助   | JSON 格式化、正则测试、颜色转换 | 前端 |
| 系统信息   | 系统信息                        | Rust |

## 设计约定

- **样式**：使用 Tailwind CSS v4 工具类，不新增自定义组件样式。设计令牌是 `src/styles/tokens.css` 里的 `--ot-*` 变量，由 `src/styles/index.css` 的 `@theme inline` 映射成工具类（`bg-surface`、`text-fg-muted`、`border-line`、`rounded-md`…），因此深色 / 浅色主题切换只需改 `html[data-theme]`，工具类和组件都不用动。
  - `base.css` 必须包在 `@layer base`、`tools.css` 包在 `@layer components`，否则未分层样式会覆盖工具类。
  - `tools.css` 中仍有各工具页面复用的语义类（`.ot-workspace`、`.ot-code`、`.ot-kv`、`.ot-diff-*` 等），按需逐步迁移。
- **状态边界**：跨工具共享的状态放 `features/*/store.ts`（Zustand + persist），组件内部的一次性状态用 `useState`。
- **IPC 边界**：所有原生调用必须经过 `lib/ipc.ts`，便于统一错误处理与后续埋点。
- **工具自洽**：工具之间不互相引用，公共能力下沉到 `components/ui` 或 `lib`。

## License

MIT
