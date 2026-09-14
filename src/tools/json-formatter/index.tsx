import { Braces, Eraser, ListFilter, Play } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  Badge,
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

type IndentKey = "2" | "4" | "tab";

const INDENT_OPTIONS: { value: IndentKey; label: string }[] = [
  { value: "2", label: "2 空格" },
  { value: "4", label: "4 空格" },
  { value: "tab", label: "Tab" },
];

const INDENT_VALUE: Record<IndentKey, string | number> = { "2": 2, "4": 4, tab: "\t" };

const TOKEN_PATTERN =
  /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}[\],])/g;

/** 极简 JSON 语法高亮：把格式化结果按 token 拆成带颜色的节点 */
function highlightJson(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = new RegExp(TOKEN_PATTERN.source, "g");
  let cursor = 0;
  let tokenKey = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

    const [, key, str, num, bool, nul, punct] = match;
    const className = key
      ? "ot-token--key"
      : str
        ? "ot-token--string"
        : num
          ? "ot-token--number"
          : bool
            ? "ot-token--boolean"
            : nul
              ? "ot-token--null"
              : punct
                ? "ot-token--punct"
                : undefined;

    nodes.push(
      <span key={tokenKey++} className={className}>
        {match[0]}
      </span>,
    );
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/** 递归按键名排序，保证输出稳定 */
function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function collectStats(text: string): { label: string; value: string }[] {
  return [
    { label: "字符", value: String([...text].length) },
    { label: "行数", value: String(text ? text.split("\n").length : 0) },
    { label: "体积", value: `${new TextEncoder().encode(text).length} B` },
  ];
}

function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<IndentKey>("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [minify, setMinify] = useState(false);
  const [strict, setStrict] = useState(false);

  const result = useMemo(() => {
    const source = strict ? input : input.trim();
    if (!source) return { state: "empty" as const };

    try {
      const parsed: unknown = JSON.parse(source);
      const prepared = sortKeys ? sortValue(parsed) : parsed;
      const output = minify
        ? JSON.stringify(prepared)
        : JSON.stringify(prepared, null, INDENT_VALUE[indent]);
      return { state: "ok" as const, output, value: prepared };
    } catch (error) {
      return {
        state: "error" as const,
        message: error instanceof Error ? error.message : "解析失败",
      };
    }
  }, [input, indent, sortKeys, minify, strict]);

  const output = result.state === "ok" ? result.output : "";
  const rootType =
    result.state === "ok"
      ? Array.isArray(result.value)
        ? `Array(${(result.value as unknown[]).length})`
        : result.value === null
          ? "null"
          : typeof result.value
      : null;
  const keyCount =
    result.state === "ok" &&
    result.value &&
    typeof result.value === "object" &&
    !Array.isArray(result.value)
      ? Object.keys(result.value as Record<string, unknown>).length
      : null;

  return (
    <div className="ot-workspace ot-workspace--split">
      <Panel>
        <PanelHead
          title="原始 JSON"
          icon={<Braces size={14} />}
          actions={
            <>
              <span className="ot-hint">{input ? `${input.length} 字符` : ""}</span>
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
            </>
          }
        />
        <PanelBody>
          <Textarea
            mono
            value={input}
            placeholder='{"name": "omni-toolbox", "tags": ["tauri", "react"]}'
            style={{ minHeight: 300 }}
            onChange={(event) => setInput(event.target.value)}
          />

          <div className="ot-options" style={{ marginTop: "var(--ot-space-4)" }}>
            <div className="ot-option">
              <span className="ot-option__label">缩进</span>
              <div className="ot-option__control">
                <Segmented value={indent} options={INDENT_OPTIONS} onValueChange={setIndent} />
              </div>
            </div>
            <div className="ot-option">
              <span className="ot-option__label">压缩</span>
              <div className="ot-option__control">
                <Switch checked={minify} onCheckedChange={setMinify} label="输出单行 JSON" />
              </div>
            </div>
            <div className="ot-option">
              <span className="ot-option__label">键排序</span>
              <div className="ot-option__control">
                <Switch
                  checked={sortKeys}
                  onCheckedChange={setSortKeys}
                  label="按字典序排列对象键"
                />
              </div>
            </div>
            <div className="ot-option">
              <span className="ot-option__label">严格模式</span>
              <div className="ot-option__control">
                <Switch
                  checked={strict}
                  onCheckedChange={setStrict}
                  label="不自动裁剪首尾空白字符"
                />
              </div>
            </div>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="格式化结果"
          icon={<Play size={14} />}
          actions={
            <>
              {sortKeys ? (
                <Badge variant="info">
                  <ListFilter size={11} />
                  已排序
                </Badge>
              ) : null}
              {result.state === "ok" ? <Badge variant="success">校验通过</Badge> : null}
              <CopyButton value={output} label="复制结果" />
            </>
          }
        />
        <PanelBody>
          {result.state === "error" ? (
            <Alert variant="error">解析失败：{result.message}</Alert>
          ) : null}

          {result.state === "ok" ? (
            <>
              <div className="ot-stats" style={{ marginBottom: "var(--ot-space-3)" }}>
                <div className="ot-stat">
                  <span className="ot-stat__label">根类型</span>
                  <span className="ot-stat__value">{rootType}</span>
                </div>
                {keyCount !== null ? (
                  <div className="ot-stat">
                    <span className="ot-stat__label">顶层键</span>
                    <span className="ot-stat__value">{keyCount}</span>
                  </div>
                ) : null}
                {collectStats(output).map((stat) => (
                  <div className="ot-stat" key={stat.label}>
                    <span className="ot-stat__label">{stat.label}</span>
                    <span className="ot-stat__value">{stat.value}</span>
                  </div>
                ))}
              </div>

              <pre className="ot-code ot-code--tall">{highlightJson(output)}</pre>
            </>
          ) : null}

          {result.state === "empty" ? (
            <EmptyState
              icon={<Braces size={20} />}
              title="等待输入"
              description="在左侧粘贴 JSON，这里会实时格式化并校验语法。"
            />
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "json-formatter",
    name: "JSON 格式化",
    description: "格式化、压缩、校验 JSON，并支持一键按键名排序",
    category: "dev",
    icon: Braces,
    keywords: ["json", "格式化", "美化", "压缩", "校验", "beautify"],
    order: 10,
  },
  component: JsonFormatterTool,
} satisfies ToolModule;
