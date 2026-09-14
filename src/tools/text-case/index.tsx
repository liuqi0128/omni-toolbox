import { CaseSensitive, Eraser, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { CopyButton, EmptyState, Panel, PanelBody, PanelHead, Textarea } from "@/components/ui";
import type { ToolModule } from "@/tools/types";

interface Converter {
  label: string;
  description: string;
  run: (words: string[], raw: string) => string;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const lower = (words: string[]) => words.map((word) => word.toLowerCase());

/** 把任意风格（camel / snake / kebab / 空格）拆成单词数组，并保留中文等非 ASCII 片段 */
function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-./\\]+/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

const CONVERTERS: Converter[] = [
  {
    label: "camelCase",
    description: "小驼峰，常用于 JS/TS 变量",
    run: (words) =>
      lower(words)
        .map((word, index) => (index === 0 ? word : capitalize(word)))
        .join(""),
  },
  {
    label: "PascalCase",
    description: "大驼峰，常用于类名与组件名",
    run: (words) =>
      lower(words)
        .map((word) => capitalize(word))
        .join(""),
  },
  {
    label: "snake_case",
    description: "下划线小写，常用于 Python / Rust / SQL",
    run: (words) => lower(words).join("_"),
  },
  {
    label: "SCREAMING_SNAKE_CASE",
    description: "下划线大写，常用于常量",
    run: (words) => lower(words).join("_").toUpperCase(),
  },
  {
    label: "kebab-case",
    description: "连字符小写，常用于 CSS / URL",
    run: (words) => lower(words).join("-"),
  },
  {
    label: "dot.case",
    description: "点分隔小写",
    run: (words) => lower(words).join("."),
  },
  {
    label: "Title Case",
    description: "每个单词首字母大写",
    run: (words) => lower(words).map(capitalize).join(" "),
  },
  {
    label: "Sentence case",
    description: "仅首字母大写",
    run: (words) => capitalize(lower(words).join(" ")),
  },
  {
    label: "UPPERCASE",
    description: "全部大写",
    run: (_words, raw) => raw.toUpperCase(),
  },
  {
    label: "lowercase",
    description: "全部小写",
    run: (_words, raw) => raw.toLowerCase(),
  },
  {
    label: "反转字符顺序",
    description: "逐字符倒序（含 Emoji 兼容）",
    run: (_words, raw) => [...raw].reverse().join(""),
  },
  {
    label: "反转单词顺序",
    description: "保留单词本身，仅调整次序",
    run: (words) => words.slice().reverse().join(" "),
  },
];

function TextCaseTool() {
  const [input, setInput] = useState("");

  const results = useMemo(
    () =>
      CONVERTERS.map((converter) => ({
        ...converter,
        value: converter.run(splitWords(input), input),
      })),
    [input],
  );

  return (
    <div className="ot-workspace ot-workspace--wide-left">
      <Panel>
        <PanelHead
          title="输入文本"
          icon={<CaseSensitive size={14} />}
          actions={<CopyButton value={input} label="复制原文" />}
        />
        <PanelBody>
          <Textarea
            mono
            value={input}
            placeholder="粘贴任意风格的文本，例如 helloWorld、hello_world、HELLO-WORLD…"
            style={{ minHeight: 220 }}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="ot-inline" style={{ marginTop: "var(--ot-space-3)" }}>
            <span className="ot-hint">
              识别 {splitWords(input).length} 个单词 / {[...input].length} 个字符
            </span>
            <button
              type="button"
              className="ot-btn ot-btn--ghost ot-btn--sm"
              disabled={!input}
              onClick={() => setInput("")}
            >
              <Eraser size={13} />
              清空
            </button>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead title="转换结果" icon={<WandSparkles size={14} />} />
        <PanelBody flush>
          {input.trim() ? (
            <div className="ot-list" style={{ padding: "var(--ot-space-3)" }}>
              {results.map((item) => (
                <div className="ot-list__item" key={item.label}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--ot-text-xs)",
                        color: "var(--ot-text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      {item.label} · {item.description}
                    </div>
                    <div className="ot-list__text" title={item.value}>
                      {item.value || "—"}
                    </div>
                  </div>
                  <CopyButton value={item.value} label="复制" iconOnly />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CaseSensitive size={20} />}
              title="等待输入"
              description="在左侧输入文本后，这里会实时给出各种命名风格的转换结果。"
            />
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "text-case",
    name: "命名风格转换",
    description: "在 camelCase、snake_case、kebab-case 等命名风格之间批量转换文本",
    category: "text",
    icon: CaseSensitive,
    keywords: ["命名", "大小写", "camel", "snake", "kebab", "case"],
    order: 10,
  },
  component: TextCaseTool,
} satisfies ToolModule;
