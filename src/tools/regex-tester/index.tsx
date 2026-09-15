import { Eraser, Regex, ScanSearch } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  Button,
  Badge,
  EmptyState,
  Input,
  Panel,
  PanelBody,
  PanelHead,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ToolModule } from "@/tools/types";

type FlagKey = "g" | "i" | "m" | "s" | "u";

const FLAG_OPTIONS: { value: FlagKey; label: string }[] = [
  { value: "g", label: "g 全局" },
  { value: "i", label: "i 忽略大小写" },
  { value: "m", label: "m 多行" },
  { value: "s", label: "s 点匹配换行" },
  { value: "u", label: "u Unicode" },
];

interface MatchInfo {
  index: number;
  text: string;
  groups: (string | undefined)[];
}

function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<FlagKey[]>(["g"]);
  const [text, setText] = useState("");

  const flagString = flags.join("");

  const compiled = useMemo(() => {
    if (!pattern) return { state: "empty" as const };
    try {
      return { state: "ok" as const, regex: new RegExp(pattern, flagString) };
    } catch (error) {
      return {
        state: "error" as const,
        message: error instanceof Error ? error.message : "正则表达式非法",
      };
    }
  }, [pattern, flagString]);

  const matches = useMemo<MatchInfo[]>(() => {
    if (compiled.state !== "ok" || !text) return [];

    const { regex } = compiled;
    const found: MatchInfo[] = [];

    if (!regex.global) {
      const match = regex.exec(text);
      if (match) {
        found.push({ index: match.index, text: match[0], groups: match.slice(1) });
      }
      return found;
    }

    const local = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;
    let guard = 0;

    while ((match = local.exec(text)) !== null && guard < 2000) {
      found.push({ index: match.index, text: match[0], groups: match.slice(1) });
      if (match[0] === "") local.lastIndex += 1;
      guard += 1;
    }

    return found;
  }, [compiled, text]);

  /** 用匹配区间把文本切成高亮片段 */
  const highlighted = useMemo<ReactNode[]>(() => {
    if (matches.length === 0) return [text];

    const nodes: ReactNode[] = [];
    let cursor = 0;

    matches.forEach((match, index) => {
      if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
      nodes.push(
        <mark
          key={`m-${index}`}
          style={{
            background: "var(--ot-brand-soft)",
            color: "var(--ot-brand)",
            borderRadius: 3,
            padding: "0 2px",
          }}
        >
          {match.text || " "}
        </mark>,
      );
      cursor = match.index + match.text.length;
    });

    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
  }, [matches, text]);

  return (
    <div className="ot-workspace ot-workspace--split">
      <Panel>
        <PanelHead
          title="正则表达式"
          icon={<Regex size={14} />}
          actions={
            <Badge variant={compiled.state === "error" ? "danger" : "brand"}>
              {flagString || "无修饰符"}
            </Badge>
          }
        />
        <PanelBody>
          <div className="ot-field">
            <label className="ot-label" htmlFor="regex-pattern">
              模式
            </label>
            <div className="ot-inline">
              <span
                style={{
                  fontFamily: "var(--ot-font-mono)",
                  color: "var(--ot-text-muted)",
                }}
              >
                /
              </span>
              <Input
                id="regex-pattern"
                mono
                className="ot-grow"
                value={pattern}
                placeholder="例：(?<year>\\d{4})-(\\d{2})"
                onChange={(event) => setPattern(event.target.value)}
              />
              <span
                style={{
                  fontFamily: "var(--ot-font-mono)",
                  color: "var(--ot-text-muted)",
                }}
              >
                /{flagString}
              </span>
            </div>
          </div>

          <div className="ot-field" style={{ marginTop: "var(--ot-space-4)" }}>
            <span className="ot-label">修饰符</span>
            <div className="ot-inline">
              {FLAG_OPTIONS.map((flag) => {
                const active = flags.includes(flag.value);
                return (
                  <button
                    key={flag.value}
                    type="button"
                    className={cn(
                      "h-7 rounded-xs border border-line px-3 text-sm transition-colors",
                      active
                        ? "bg-elevated font-medium text-fg shadow-sm"
                        : "text-fg-soft hover:text-fg",
                    )}
                    onClick={() =>
                      setFlags((current) =>
                        current.includes(flag.value)
                          ? current.filter((item) => item !== flag.value)
                          : [...current, flag.value],
                      )
                    }
                  >
                    {flag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ot-field" style={{ marginTop: "var(--ot-space-4)" }}>
            <label className="ot-label" htmlFor="regex-text">
              测试文本
            </label>
            <Textarea
              id="regex-text"
              mono
              value={text}
              placeholder="粘贴需要匹配的文本"
              style={{ minHeight: 200 }}
              onChange={(event) => setText(event.target.value)}
            />
          </div>

          <div className="ot-inline" style={{ marginTop: "var(--ot-space-3)" }}>
            <Button
              size="sm"
              variant="ghost"
              icon={<Eraser size={13} />}
              disabled={!pattern && !text}
              onClick={() => {
                setPattern("");
                setText("");
              }}
            >
              全部清空
            </Button>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="匹配结果"
          icon={<ScanSearch size={14} />}
          actions={
            <Badge variant={matches.length > 0 ? "success" : "default"}>
              {matches.length} 处匹配
            </Badge>
          }
        />
        <PanelBody>
          {compiled.state === "error" ? <Alert variant="error">{compiled.message}</Alert> : null}

          {compiled.state === "empty" ? (
            <EmptyState
              icon={<Regex size={20} />}
              title="等待输入正则"
              description="输入正则表达式后，会实时高亮匹配并列出捕获组。"
            />
          ) : null}

          {compiled.state === "ok" && text ? (
            <>
              <pre
                className="ot-code"
                style={{ maxHeight: 220, marginBottom: "var(--ot-space-4)" }}
              >
                {highlighted}
              </pre>

              {matches.length > 0 ? (
                <div className="ot-list">
                  {matches.slice(0, 200).map((match, index) => (
                    <div className="ot-list__item" key={`${match.index}-${index}`}>
                      <span className="ot-list__index">{index + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ot-list__text" title={match.text}>
                          {match.text || "(空匹配)"}
                        </div>
                        {match.groups.length > 0 ? (
                          <div
                            style={{
                              marginTop: 2,
                              fontSize: "var(--ot-text-xs)",
                              color: "var(--ot-text-muted)",
                            }}
                          >
                            {match.groups
                              .map(
                                (group, groupIndex) => `$${groupIndex + 1}=${group ?? "undefined"}`,
                              )
                              .join("  ")}
                          </div>
                        ) : null}
                      </div>
                      <Badge>@{match.index}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert variant="warning">没有匹配到任何内容。</Alert>
              )}
            </>
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "regex-tester",
    name: "正则测试",
    description: "实时验证正则表达式，高亮匹配结果并展示捕获组",
    category: "dev",
    icon: Regex,
    keywords: ["regex", "正则", "匹配", "测试"],
    order: 20,
  },
  component: RegexTesterTool,
} satisfies ToolModule;
