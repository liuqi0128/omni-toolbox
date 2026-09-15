import { ExternalLink, Info, Wrench } from "lucide-react";

import { Badge, Panel, PanelBody, PanelHead } from "@/components/ui";
import { APP_DESCRIPTION, APP_NAME, APP_NAME_EN, APP_REPOSITORY, APP_VERSION } from "@/config/app";
import { isTauriRuntime } from "@/lib/ipc";
import { tools } from "@/tools/registry";

const TECH_STACK = [
  { label: "Tauri 2", desc: "原生外壳与 Rust 后端" },
  { label: "React 19", desc: "声明式 UI" },
  { label: "TypeScript", desc: "端到端类型安全" },
  { label: "Vite", desc: "极速开发与构建" },
  { label: "Tailwind CSS", desc: "原子化样式" },
  { label: "Zustand", desc: "轻量状态管理" },
  { label: "pnpm", desc: "包管理器" },
];

/** 与 Button 的 secondary + sm 外观一致，用于链接元素 */
const LINK_BUTTON_CLASS =
  "inline-flex h-[26px] items-center justify-center gap-2 rounded-sm border border-line bg-elevated px-2 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-hover";

export function AboutPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
      <div className="flex max-w-[760px] flex-col gap-4">
        <Panel>
          <PanelHead title="项目信息" icon={<Info size={14} />} />
          <PanelBody>
            <h2>{APP_NAME}</h2>
            <p className="mt-2 text-fg-muted">
              {APP_NAME_EN} · v{APP_VERSION}
            </p>
            <p className="mt-3">{APP_DESCRIPTION}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="brand">已注册 {tools.length} 个工具</Badge>
              <Badge variant={isTauriRuntime() ? "success" : "warning"}>
                {isTauriRuntime() ? "原生环境运行中" : "浏览器预览模式"}
              </Badge>
            </div>

            <div className="mt-4">
              <a
                className={LINK_BUTTON_CLASS}
                href={APP_REPOSITORY}
                target="_blank"
                rel="noreferrer noopener"
              >
                <ExternalLink size={13} />
                访问项目主页
              </a>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="技术栈" icon={<Wrench size={14} />} />
          <PanelBody>
            <div className="flex flex-wrap gap-2">
              {TECH_STACK.map((item) => (
                <Badge key={item.label} title={item.desc}>
                  {item.label}
                </Badge>
              ))}
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
