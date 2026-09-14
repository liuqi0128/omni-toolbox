import { CalendarClock, Clock, Eraser } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, Button, CopyButton, Panel, PanelBody, PanelHead, Textarea } from "@/components/ui";
import type { ToolModule } from "@/tools/types";

/** 宽松解析：支持秒级 / 毫秒级时间戳、日期字符串，以及“now” */
function parseInput(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^now$/i.test(value)) return new Date();

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = Number(value);
    // 10 位及以下按秒处理，否则按毫秒
    const ms = Math.abs(num) < 1e11 ? num * 1000 : num;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelative(date: Date, now: number): string {
  const diff = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? "后" : "前";

  if (abs < 60) return `${abs} 秒${suffix}`;
  if (abs < 3600) return `${Math.round(abs / 60)} 分钟${suffix}`;
  if (abs < 86400) return `${Math.round(abs / 3600)} 小时${suffix}`;
  if (abs < 2592000) return `${Math.round(abs / 86400)} 天${suffix}`;
  if (abs < 31536000) return `${Math.round(abs / 2592000)} 个月${suffix}`;
  return `${(abs / 31536000).toFixed(1)} 年${suffix}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function TimestampTool() {
  const [input, setInput] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const date = useMemo(() => parseInput(input), [input]);

  const rows = useMemo(() => {
    if (!date) return [];

    return [
      { label: "Unix 秒", value: String(Math.floor(date.getTime() / 1000)) },
      { label: "Unix 毫秒", value: String(date.getTime()) },
      { label: "ISO 8601", value: date.toISOString() },
      {
        label: "本地时间",
        value: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
      },
      {
        label: "UTC 时间",
        value: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`,
      },
      { label: "星期", value: `星期${"日一二三四五六"[date.getDay()]}` },
      { label: "相对现在", value: formatRelative(date, now) },
      {
        label: "时区偏移",
        value: `UTC${-date.getTimezoneOffset() / 60 >= 0 ? "+" : ""}${-date.getTimezoneOffset() / 60}`,
      },
    ];
  }, [date, now]);

  const nowRows = [
    { label: "Unix 秒", value: String(Math.floor(now / 1000)) },
    { label: "Unix 毫秒", value: String(now) },
    { label: "ISO 8601", value: new Date(now).toISOString() },
  ];

  return (
    <div className="ot-workspace ot-workspace--split">
      <div className="ot-stack">
        <Panel>
          <PanelHead
            title="当前时间"
            icon={<Clock size={14} />}
            actions={<CopyButton value={String(Math.floor(now / 1000))} label="复制秒级" />}
          />
          <PanelBody>
            <div className="ot-kv">
              {nowRows.map((row) => (
                <div className="ot-kv__row" key={row.label}>
                  <span className="ot-kv__key">{row.label}</span>
                  <span className="ot-kv__value">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="ot-hint" style={{ marginTop: "var(--ot-space-2)" }}>
              每秒自动刷新
            </p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            title="待转换内容"
            icon={<CalendarClock size={14} />}
            actions={
              <>
                <Button size="sm" variant="ghost" onClick={() => setInput("now")}>
                  填入 now
                </Button>
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
              placeholder={
                "支持格式：\n1735660800（秒）\n1735660800000（毫秒）\n2025-01-01 08:00:00\nnow"
              }
              style={{ minHeight: 140 }}
              onChange={(event) => setInput(event.target.value)}
            />
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHead
          title="转换结果"
          icon={<CalendarClock size={14} />}
          actions={
            <CopyButton
              value={rows.map((row) => `${row.label}: ${row.value}`).join("\n")}
              label="复制全部"
            />
          }
        />
        <PanelBody>
          {input.trim() === "" ? (
            <Alert variant="info">输入时间戳或日期字符串后，这里会同时给出多种表示形式。</Alert>
          ) : null}

          {input.trim() !== "" && !date ? (
            <Alert variant="error">无法识别的输入，请检查时间戳或日期格式是否正确。</Alert>
          ) : null}

          {date ? (
            <div className="ot-kv">
              {rows.map((row) => (
                <div className="ot-kv__row" key={row.label}>
                  <span className="ot-kv__key">{row.label}</span>
                  <span className="ot-kv__value">{row.value}</span>
                  <CopyButton value={row.value} label="复制" iconOnly />
                </div>
              ))}
            </div>
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "timestamp",
    name: "时间戳转换",
    description: "Unix 时间戳与日期字符串互转，支持秒/毫秒与多时区展示",
    category: "time",
    icon: CalendarClock,
    keywords: ["timestamp", "unix", "时间戳", "日期", "时间"],
    order: 10,
  },
  component: TimestampTool,
} satisfies ToolModule;
