import { Eraser, Link, ListFilter, Settings2 } from "lucide-react";
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
  Textarea,
} from "@/components/ui";
import type { ToolModule } from "@/tools/types";

type CodecKey = "componentEncode" | "componentDecode" | "uriEncode" | "uriDecode";

const CODEC_OPTIONS: { value: CodecKey; label: string }[] = [
  { value: "componentEncode", label: "encodeURIComponent" },
  { value: "componentDecode", label: "decodeURIComponent" },
  { value: "uriEncode", label: "encodeURI" },
  { value: "uriDecode", label: "decodeURI" },
];

const CODEC_FN: Record<CodecKey, (value: string) => string> = {
  componentEncode: encodeURIComponent,
  componentDecode: decodeURIComponent,
  uriEncode: encodeURI,
  uriDecode: decodeURI,
};

interface QueryParam {
  key: string;
  value: string;
}

/** 从完整 URL 或纯查询串中解析参数 */
function parseQuery(input: string): QueryParam[] {
  const raw = input.trim();
  if (!raw) return [];

  const queryIndex = raw.indexOf("?");
  const hashIndex = raw.indexOf("#");
  const query =
    queryIndex >= 0
      ? raw.slice(queryIndex + 1, hashIndex > queryIndex ? hashIndex : undefined)
      : raw;

  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  const result: QueryParam[] = [];

  params.forEach((value, key) => result.push({ key, value }));
  return result;
}

function UrlCodecTool() {
  const [input, setInput] = useState("");
  const [codec, setCodec] = useState<CodecKey>("componentEncode");

  const result = useMemo(() => {
    if (!input) return { state: "empty" as const };
    try {
      return { state: "ok" as const, output: CODEC_FN[codec](input) };
    } catch {
      return {
        state: "error" as const,
        message: "解码失败：输入内容包含非法的百分号编码序列（例如单独的 % 或 %ZZ）。",
      };
    }
  }, [input, codec]);

  const params = useMemo(() => parseQuery(input), [input]);
  const output = result.state === "ok" ? result.output : "";

  return (
    <div className="ot-workspace ot-workspace--wide-left">
      <div className="ot-stack">
        <Panel>
          <PanelHead
            title="输入"
            icon={<Link size={14} />}
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
            <Segmented value={codec} options={CODEC_OPTIONS} onValueChange={setCodec} />
            <Textarea
              mono
              value={input}
              placeholder="输入 URL、查询串或任意需要编解码的文本"
              style={{ minHeight: 120, marginTop: "var(--ot-space-3)" }}
              onChange={(event) => setInput(event.target.value)}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            title="输出"
            icon={<Link size={14} />}
            actions={<CopyButton value={output} label="复制结果" />}
          />
          <PanelBody>
            {result.state === "error" ? <Alert variant="error">{result.message}</Alert> : null}
            {result.state === "ok" ? <pre className="ot-code">{output}</pre> : null}
            {result.state === "empty" ? (
              <EmptyState
                icon={<Link size={20} />}
                title="等待输入"
                description="输入内容后，这里会实时展示编解码结果。"
              />
            ) : null}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHead
          title="查询参数解析"
          icon={<ListFilter size={14} />}
          actions={<span className="ot-badge">{params.length} 项</span>}
        />
        <PanelBody flush>
          {params.length > 0 ? (
            <div className="ot-list" style={{ padding: "var(--ot-space-3)" }}>
              {params.map((param, index) => (
                <div className="ot-list__item" key={`${param.key}-${index}`}>
                  <span className="ot-list__index">{index + 1}</span>
                  <span
                    style={{
                      color: "var(--ot-info)",
                      flexShrink: 0,
                      maxWidth: 140,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={param.key}
                  >
                    {param.key}
                  </span>
                  <span className="ot-list__text" title={param.value}>
                    {param.value || "—"}
                  </span>
                  <CopyButton value={param.value} label="复制" iconOnly />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Settings2 size={20} />}
              title="没有可解析的参数"
              description="粘贴包含 ?a=1&b=2 的完整 URL 或查询串后，这里会逐项列出参数。"
            />
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "url-codec",
    name: "URL 编解码",
    description: "URI 百分号编解码，并自动解析 URL 中的查询参数",
    category: "encode",
    icon: Link,
    keywords: ["url", "uri", "encode", "decode", "查询参数", "query"],
    order: 20,
  },
  component: UrlCodecTool,
} satisfies ToolModule;
