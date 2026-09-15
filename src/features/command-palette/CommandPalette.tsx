import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Badge, Kbd } from "@/components/ui";
import { useHistoryStore } from "@/features/history/store";
import { cn } from "@/lib/cn";
import { getTool, searchTools, visibleTools } from "@/tools/registry";
import type { ToolEntry } from "@/tools/types";

import { usePaletteStore } from "./store";

const MAX_RESULTS = 40;

/**
 * 面板主体。仅在打开时挂载，因此查询词与高亮项会随关闭自动重置，
 * 无需在 effect 中手动清理状态。
 */
function PaletteDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const recentIds = useHistoryStore((state) => state.ids);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo<ToolEntry[]>(() => {
    if (query.trim()) return searchTools(query).slice(0, MAX_RESULTS);

    const ordered: ToolEntry[] = [];
    for (const id of recentIds) {
      const tool = getTool(id);
      if (tool && !tool.hidden) ordered.push(tool);
    }
    for (const tool of visibleTools) {
      if (!ordered.includes(tool)) ordered.push(tool);
    }
    return ordered.slice(0, MAX_RESULTS);
  }, [query, recentIds]);

  // 让高亮项始终位于可视区域内
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const select = (id: string) => {
    onClose();
    void navigate(`/tool/${id}`);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) select(target.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex animate-fade-in items-start justify-center bg-black/50 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[60vh] w-[min(620px,calc(100vw-80px))] animate-palette-in flex-col overflow-hidden rounded-lg border border-line-strong bg-elevated shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4 text-fg-muted">
          <Search size={16} aria-hidden />
          <input
            ref={inputRef}
            className="h-full flex-1 text-md text-fg outline-none placeholder:text-fg-muted"
            value={query}
            placeholder="搜索工具或功能…"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2" ref={listRef}>
          <div className="px-3 pt-2 pb-1 text-xs font-semibold tracking-[0.08em] text-fg-muted uppercase">
            {query.trim() ? `${results.length} 个结果` : "最近使用与全部工具"}
          </div>

          {results.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                data-index={index}
                className={cn(
                  "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-base transition-colors",
                  index === activeIndex ? "bg-brand-soft text-brand" : "text-fg-soft",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(tool.id)}
              >
                <Icon size={15} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                <Badge>{tool.description}</Badge>
              </button>
            );
          })}

          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-fg-muted">没有找到匹配的工具</div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-4 border-t border-line px-4 py-2 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            选择
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Enter</Kbd>
            打开
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Esc</Kbd>
            关闭
          </span>
        </div>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const open = usePaletteStore((state) => state.open);
  const setOpen = usePaletteStore((state) => state.setOpen);

  // 全局快捷键：Ctrl/Cmd + K 唤起，Esc 关闭
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!usePaletteStore.getState().open);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);

  if (!open) return null;

  return <PaletteDialog onClose={() => setOpen(false)} />;
}
