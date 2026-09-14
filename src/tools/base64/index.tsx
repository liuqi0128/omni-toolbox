import { ArrowRightLeft, Binary, Eraser } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Alert,
  Button,
  CopyButton,
  EmptyState,
  Panel,
  PanelBody,
  PanelHead,
  Segmented,
  Switch,
  Textarea,
} from "@/components/ui";
import type { ToolModule } from "@/tools/types";

type Mode = "encode" | "decode";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "encode", label: "编码" },
  { value: "decode", label: "解码" },
];

function encodeBase64(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded;
}

function decodeBase64(text: string, urlSafe: boolean): string {
  const normalized = urlSafe
    ? text.trim().replace(/-/g, "+").replace(/_/g, "/")
    : text.trim().replace(/\s+/g, "");

  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function Base64Tool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);

  const result = useMemo(() => {
    if (!input) return { state: "empty" as const };

    try {
      const output =
        mode === "encode" ? encodeBase64(input, urlSafe) : decodeBase64(input, urlSafe);

      return {
        state: "ok" as const,
        output,
        inputBytes: new TextEncoder().encode(input).length,
      };
    } catch {
      return {
        state: "error" as const,
        message: "输入内容不是合法的 Base64 字符串，请检查是否包含非法字符。",
      };
    }
  }, [input, mode, urlSafe]);

  const output = result.state === "ok" ? result.output : "";

  return (
    <div className="ot-workspace ot-workspace--split">
      <Panel>
        <PanelHead
          title={mode === "encode" ? "原文" : "Base64 密文"}
          icon={<Binary size={14} />}
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
          <div className="ot-inline" style={{ marginBottom: "var(--ot-space-3)" }}>
            <Segmented value={mode} options={MODE_OPTIONS} onValueChange={setMode} />
            <button
              type="button"
              className="ot-btn ot-btn--ghost ot-btn--sm"
              onClick={() => {
                if (result.state === "ok") {
                  setInput(output);
                  setMode(mode === "encode" ? "decode" : "encode");
                }
              }}
              disabled={result.state !== "ok"}
            >
              <ArrowRightLeft size={13} />
              结果转输入
            </button>
          </div>

          <Textarea
            mono
            value={input}
            placeholder={
              mode === "encode" ? "输入需要编码的文本，支持中文" : "输入需要解码的 Base64"
            }
            style={{ minHeight: 240 }}
            onChange={(event) => setInput(event.target.value)}
          />

          <div className="ot-inline" style={{ marginTop: "var(--ot-space-3)" }}>
            <Switch
              checked={urlSafe}
              onCheckedChange={setUrlSafe}
              label="URL 安全字符集（- _，省略 = 填充）"
            />
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="输出结果"
          icon={<ArrowRightLeft size={14} />}
          actions={<CopyButton value={output} label="复制结果" />}
        />
        <PanelBody>
          {result.state === "error" ? <Alert variant="error">{result.message}</Alert> : null}

          {result.state === "ok" ? (
            <>
              <div className="ot-stats" style={{ marginBottom: "var(--ot-space-3)" }}>
                <div className="ot-stat">
                  <span className="ot-stat__label">输入字节</span>
                  <span className="ot-stat__value">{result.inputBytes}</span>
                </div>
                <div className="ot-stat">
                  <span className="ot-stat__label">输出字符</span>
                  <span className="ot-stat__value">{[...output].length}</span>
                </div>
              </div>
              <pre className="ot-code ot-code--tall">{output}</pre>
            </>
          ) : null}

          {result.state === "empty" ? (
            <EmptyState
              icon={<Binary size={20} />}
              title="等待输入"
              description="左侧输入内容后可实时得到 Base64 编解码结果，中文按 UTF-8 处理。"
            />
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "base64",
    name: "Base64 编解码",
    description: "文本与 Base64 互转，支持 UTF-8 中文与 URL 安全字符集",
    category: "encode",
    icon: Binary,
    keywords: ["base64", "编码", "解码", "url safe"],
    order: 10,
  },
  component: Base64Tool,
} satisfies ToolModule;
