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
  { label: "Zustand", desc: "轻量状态管理" },
  { label: "pnpm", desc: "包管理器" },
];

export function AboutPage() {
  return (
    <div className="ot-page-scroll">
      <div className="ot-doc">
        <Panel>
          <PanelHead title="项目信息" icon={<Info size={14} />} />
          <PanelBody>
            <h2>{APP_NAME}</h2>
            <p className="ot-muted" style={{ marginTop: "var(--ot-space-2)" }}>
              {APP_NAME_EN} · v{APP_VERSION}
            </p>
            <p style={{ marginTop: "var(--ot-space-3)" }}>{APP_DESCRIPTION}</p>

            <div className="ot-inline" style={{ marginTop: "var(--ot-space-4)" }}>
              <Badge variant="brand">已注册 {tools.length} 个工具</Badge>
              <Badge variant={isTauriRuntime() ? "success" : "warning"}>
                {isTauriRuntime() ? "原生环境运行中" : "浏览器预览模式"}
              </Badge>
            </div>

            <div style={{ marginTop: "var(--ot-space-4)" }}>
              <a
                className="ot-btn ot-btn--secondary ot-btn--sm"
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
            <div className="ot-about__tech">
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
