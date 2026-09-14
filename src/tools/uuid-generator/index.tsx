import { Dices, Eraser, RefreshCw } from "lucide-react";
import { useState } from "react";

import {
  Alert,
  Button,
  Badge,
  CopyButton,
  EmptyState,
  Input,
  Panel,
  PanelBody,
  PanelHead,
  Segmented,
  Switch,
} from "@/components/ui";
import { call, isTauriRuntime, toMessage } from "@/lib/ipc";
import type { ToolModule } from "@/tools/types";

type UuidKind = "v4" | "v7";

const KIND_OPTIONS: { value: UuidKind; label: string }[] = [
  { value: "v7", label: "v7（时间有序）" },
  { value: "v4", label: "v4（随机）" },
];

const MAX_COUNT = 1000;

function UuidGeneratorTool() {
  const [count, setCount] = useState(5);
  const [kind, setKind] = useState<UuidKind>("v7");
  const [upper, setUpper] = useState(false);
  const [hyphen, setHyphen] = useState(true);

  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async (nextCount = count, nextKind = kind) => {
    setBusy(true);
    try {
      const result = await call<string[]>("generate_uuids", {
        count: nextCount,
        kind: nextKind,
        upper,
        hyphen,
      });
      setItems(result);
      setError(null);
    } catch (cause) {
      setItems([]);
      setError(toMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const step = (delta: number) => {
    const next = Math.min(MAX_COUNT, Math.max(1, count + delta));
    setCount(next);
    return next;
  };

  return (
    <div className="ot-workspace ot-workspace--split">
      <Panel>
        <PanelHead title="生成参数" icon={<Dices size={14} />} />
        <PanelBody>
          <div className="ot-options">
            <div className="ot-option">
              <span className="ot-option__label">版本</span>
              <div className="ot-option__control">
                <Segmented
                  value={kind}
                  options={KIND_OPTIONS}
                  onValueChange={(value) => {
                    setKind(value);
                    void generate(count, value);
                  }}
                />
              </div>
            </div>

            <div className="ot-option">
              <span className="ot-option__label">数量</span>
              <div className="ot-option__control">
                <div className="ot-inline">
                  <Button size="sm" onClick={() => step(-5)} disabled={count <= 1}>
                    -5
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={MAX_COUNT}
                    value={count}
                    style={{ width: 90 }}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      setCount(
                        Number.isFinite(parsed) ? Math.min(MAX_COUNT, Math.max(1, parsed)) : 1,
                      );
                    }}
                  />
                  <Button size="sm" onClick={() => step(5)} disabled={count >= MAX_COUNT}>
                    +5
                  </Button>
                  <span className="ot-hint">上限 {MAX_COUNT}</span>
                </div>
              </div>
            </div>

            <div className="ot-option">
              <span className="ot-option__label">大写</span>
              <div className="ot-option__control">
                <Switch checked={upper} onCheckedChange={setUpper} label="输出大写形式" />
              </div>
            </div>

            <div className="ot-option">
              <span className="ot-option__label">连字符</span>
              <div className="ot-option__control">
                <Switch checked={hyphen} onCheckedChange={setHyphen} label="保留 8-4-4-4-12 分隔" />
              </div>
            </div>
          </div>

          <div className="ot-inline" style={{ marginTop: "var(--ot-space-5)" }}>
            <Button
              variant="primary"
              icon={<RefreshCw size={14} />}
              disabled={busy}
              onClick={() => void generate()}
            >
              {busy ? "生成中…" : "生成"}
            </Button>
            <Button
              icon={<Eraser size={13} />}
              disabled={items.length === 0}
              onClick={() => {
                setItems([]);
                setError(null);
              }}
            >
              清空结果
            </Button>
          </div>

          {!isTauriRuntime() ? (
            <Alert variant="warning">
              <span style={{ display: "block", marginTop: "var(--ot-space-2)" }}>
                UUID 由 Rust 后端生成，请通过 <code>pnpm tauri:dev</code> 启动桌面端使用。
              </span>
            </Alert>
          ) : null}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="生成结果"
          icon={<Dices size={14} />}
          actions={
            <>
              <Badge variant={items.length > 0 ? "success" : "default"}>{items.length} 条</Badge>
              <CopyButton value={items.join("\n")} label="复制全部" />
            </>
          }
        />
        <PanelBody flush>
          {error ? (
            <div style={{ padding: "var(--ot-space-3)" }}>
              <Alert variant="error">{error}</Alert>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="ot-list" style={{ padding: "var(--ot-space-3)" }}>
              {items.map((item, index) => (
                <div className="ot-list__item" key={item}>
                  <span className="ot-list__index">{index + 1}</span>
                  <span className="ot-list__text">{item}</span>
                  <CopyButton value={item} label="复制" iconOnly />
                </div>
              ))}
            </div>
          ) : null}

          {!error && items.length === 0 ? (
            <EmptyState
              icon={<Dices size={20} />}
              title="尚未生成"
              description="设置参数后点击「生成」，结果会调用 Rust 后端批量产出。"
            />
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "uuid-generator",
    name: "UUID 生成器",
    description: "基于 Rust 后端批量生成 UUID v4 / v7，可控制大小写与连字符",
    category: "crypto",
    icon: Dices,
    keywords: ["uuid", "guid", "唯一标识", "随机", "v4", "v7"],
    order: 20,
  },
  component: UuidGeneratorTool,
} satisfies ToolModule;
