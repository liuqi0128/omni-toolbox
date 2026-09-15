import { Eraser, FingerprintPattern } from "lucide-react";
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
  Textarea,
} from "@/components/ui";
import { call, isTauriRuntime, toMessage } from "@/lib/ipc";
import type { ToolModule } from "@/tools/types";

interface DigestSet {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

const ALGORITHMS: { key: keyof DigestSet; label: string; note: string }[] = [
  { key: "md5", label: "MD5", note: "128 位，仅用于校验和，不可用于安全场景" },
  { key: "sha1", label: "SHA-1", note: "160 位，已被证明不安全，仅作兼容用" },
  { key: "sha256", label: "SHA-256", note: "256 位，推荐用于完整性校验" },
  { key: "sha512", label: "SHA-512", note: "512 位，安全性最高" },
];

const DEBOUNCE_MS = 200;

function HashGeneratorTool() {
  const [input, setInput] = useState("");
  const [digests, setDigests] = useState<DigestSet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await call<DigestSet>("hash_text", { text: input });
          if (cancelled) return;
          setDigests(result);
          setError(null);
        } catch (cause) {
          if (cancelled) return;
          setDigests(null);
          setError(toMessage(cause));
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input]);

  const current = input ? digests : null;
  const bytes = new TextEncoder().encode(input).length;

  return (
    <div className="ot-workspace ot-workspace--split">
      <Panel>
        <PanelHead
          title="输入文本"
          icon={<FingerprintPattern size={14} />}
          actions={
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={<Eraser size={13} />}
              title="清空"
              aria-label="清空"
              disabled={!input}
              onClick={() => setInput("")}
            />
          }
        />
        <PanelBody>
          <Textarea
            mono
            value={input}
            placeholder="输入任意文本，实时计算 MD5 与 SHA 系列摘要"
            style={{ minHeight: 260 }}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="ot-inline" style={{ marginTop: "var(--ot-space-3)" }}>
            <span className="ot-hint">
              {bytes} 字节 / {[...input].length} 字符
            </span>
          </div>

          {!isTauriRuntime() ? (
            <Alert variant="warning">
              <span style={{ display: "block", marginTop: "var(--ot-space-2)" }}>
                摘要计算由 Rust 后端完成，请通过 <code>pnpm tauri:dev</code> 启动桌面端使用。
              </span>
            </Alert>
          ) : null}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="摘要结果"
          icon={<FingerprintPattern size={14} />}
          actions={
            current ? (
              <CopyButton
                label="复制摘要"
                value={ALGORITHMS.map((item) => `${item.label}: ${current[item.key]}`).join("\n")}
              />
            ) : null
          }
        />
        <PanelBody>
          {error ? <Alert variant="error">{error}</Alert> : null}

          {current ? (
            <div className="ot-list">
              {ALGORITHMS.map((item) => (
                <div className="ot-list__item" key={item.key} style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--ot-space-2)",
                        marginBottom: 2,
                      }}
                    >
                      <Badge variant="brand">{item.label}</Badge>
                      <span className="ot-hint">{item.note}</span>
                    </div>
                    <div
                      className="ot-list__text"
                      style={{ whiteSpace: "normal", wordBreak: "break-all" }}
                    >
                      {current[item.key]}
                    </div>
                  </div>
                  <CopyButton value={current[item.key]} label="复制" iconOnly />
                </div>
              ))}
            </div>
          ) : null}

          {!error && !current ? (
            <EmptyState
              icon={<FingerprintPattern size={20} />}
              title="等待输入"
              description="左侧输入内容后，会调用 Rust 后端实时计算四类摘要值。"
            />
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "hash-generator",
    name: "哈希摘要",
    description: "基于 Rust 后端计算 MD5 / SHA-1 / SHA-256 / SHA-512 摘要",
    category: "crypto",
    icon: FingerprintPattern,
    keywords: ["hash", "md5", "sha1", "sha256", "sha512", "摘要", "校验"],
    order: 10,
  },
  component: HashGeneratorTool,
} satisfies ToolModule;
