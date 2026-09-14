import { Cpu, RefreshCw, Shield } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  CopyButton,
  EmptyState,
  Panel,
  PanelBody,
  PanelHead,
} from "@/components/ui";
import { call, isTauriRuntime, toMessage } from "@/lib/ipc";
import type { ToolModule } from "@/tools/types";

interface SystemInfo {
  backendVersion: string;
  os: string;
  osFamily: string;
  arch: string;
  hostname: string;
  cpuCores: number;
  runtimeSeconds: number;
  exePath: string;
  workingDir: string;
  debugBuild: boolean;
}

const OS_LABELS: Record<string, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  ios: "iOS",
  android: "Android",
  freebsd: "FreeBSD",
};

const ARCH_LABELS: Record<string, string> = {
  x86_64: "x86-64",
  aarch64: "ARM64",
  x86: "x86",
  arm: "ARM",
};

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours > 0 ? `${hours} 小时` : null, minutes > 0 ? `${minutes} 分` : null, `${rest} 秒`]
    .filter(Boolean)
    .join(" ");
}

function SystemInfoTool() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // 状态更新都发生在 Promise 回调中，避免在 effect 内同步触发级联渲染
  useEffect(() => {
    let cancelled = false;

    call<SystemInfo>("system_info")
      .then((result) => {
        if (cancelled) return;
        setInfo(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(toMessage(cause));
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const loading = info === null && error === null;

  const reload = () => {
    setInfo(null);
    setError(null);
    setReloadToken((token) => token + 1);
  };

  const rows = info
    ? [
        { label: "操作系统", value: OS_LABELS[info.os] ?? info.os, wide: false },
        { label: "系统家族", value: info.osFamily },
        { label: "CPU 架构", value: ARCH_LABELS[info.arch] ?? info.arch },
        { label: "逻辑核心", value: `${info.cpuCores} 核` },
        { label: "主机名", value: info.hostname },
        { label: "后端版本", value: `v${info.backendVersion}` },
        { label: "已运行", value: formatUptime(info.runtimeSeconds) },
        { label: "构建模式", value: info.debugBuild ? "Debug" : "Release" },
        { label: "可执行文件", value: info.exePath, wide: true },
        { label: "工作目录", value: info.workingDir, wide: true },
      ]
    : [];

  return (
    <div className="ot-workspace ot-workspace--wide-left">
      <Panel>
        <PanelHead
          title="宿主环境"
          icon={<Cpu size={14} />}
          actions={
            <>
              {info ? <Badge variant="brand">{OS_LABELS[info.os] ?? info.os}</Badge> : null}
              <CopyButton
                label="复制全部"
                value={rows.map((row) => `${row.label}: ${row.value}`).join("\n")}
              />
              <Button size="sm" icon={<RefreshCw size={13} />} disabled={loading} onClick={reload}>
                刷新
              </Button>
            </>
          }
        />
        <PanelBody>
          {error ? <Alert variant="error">{error}</Alert> : null}

          {info ? (
            <div className="ot-kv">
              {rows.map((row) => (
                <div className="ot-kv__row" key={row.label}>
                  <span className="ot-kv__key">{row.label}</span>
                  <span
                    className="ot-kv__value"
                    style={row.wide ? { whiteSpace: "normal", wordBreak: "break-all" } : undefined}
                  >
                    {row.value}
                  </span>
                  <CopyButton value={row.value} label="复制" iconOnly />
                </div>
              ))}
            </div>
          ) : null}

          {!info && !error ? (
            <EmptyState
              icon={<Cpu size={20} />}
              title={loading ? "正在读取…" : "暂无数据"}
              description="系统信息由 Rust 后端采集，包含系统、架构与进程运行状态。"
            />
          ) : null}
        </PanelBody>
      </Panel>

      <div className="ot-stack">
        <Panel>
          <PanelHead title="说明" icon={<Shield size={14} />} />
          <PanelBody>
            <p className="ot-hint">
              所有信息均在本机通过 <code>std</code> 标准库采集，不读取任何用户隐私数据，也不会上传。
            </p>
            <p className="ot-hint" style={{ marginTop: "var(--ot-space-2)" }}>
              “已运行”指后端进程的存活时长，随窗口重启重置。
            </p>
          </PanelBody>
        </Panel>

        {!isTauriRuntime() ? (
          <Alert variant="warning">
            当前运行在浏览器预览模式，原生能力不可用。请执行 <code>pnpm tauri:dev</code>{" "}
            启动桌面端。
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

export default {
  meta: {
    id: "system-info",
    name: "系统信息",
    description: "查看操作系统、CPU 架构、主机名与进程运行状态",
    category: "system",
    icon: Cpu,
    keywords: ["system", "系统", "cpu", "架构", "主机", "环境", "信息"],
    order: 10,
  },
  component: SystemInfoTool,
} satisfies ToolModule;
