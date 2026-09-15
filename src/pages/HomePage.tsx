import { Search, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge, EmptyState, Kbd, SearchInput } from "@/components/ui";
import { APP_NAME } from "@/config/app";
import { useFavoritesStore } from "@/features/favorites/store";
import { toolGroups, visibleTools } from "@/tools/registry";
import type { ToolEntry } from "@/tools/types";

interface ToolCardProps {
  tool: ToolEntry;
  onOpen: (id: string) => void;
}

function ToolCard({ tool, onOpen }: ToolCardProps) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-px hover:border-brand hover:bg-elevated"
      onClick={() => onOpen(tool.id)}
    >
      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
        <Icon size={17} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-md font-semibold text-fg">{tool.name}</span>
        <span className="line-clamp-2 text-sm leading-normal text-fg-muted">
          {tool.description}
        </span>
      </span>
    </button>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const favoriteIds = useFavoritesStore((state) => state.ids);

  const open = (id: string) => void navigate(`/tool/${id}`);

  const keyword = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      keyword ? visibleTools.filter((tool) => tool.searchText.includes(keyword)) : visibleTools,
    [keyword],
  );

  const favoriteTools = favoriteIds
    .map((id) => visibleTools.find((tool) => tool.id === id))
    .filter((tool): tool is ToolEntry => Boolean(tool));

  const groups = useMemo(
    () =>
      toolGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((tool) => matches.includes(tool)),
        }))
        .filter((group) => group.items.length > 0),
    [matches],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pb-2 [scrollbar-gutter:stable] [&>*]:shrink-0">
      <section className="relative overflow-hidden rounded-xl border border-line bg-surface bg-[image:radial-gradient(120%_140%_at_0%_0%,var(--ot-brand-soft),transparent_60%)] p-6">
        <h1 className="text-2xl font-bold tracking-[-0.01em]">{APP_NAME}</h1>
        <p className="mt-1 max-w-[560px] text-md text-fg-soft">
          把日常用得到的小工具收进同一个窗口。新增工具只需在 <code>src/tools/</code>{" "}
          下建立目录，导航与路由会自动生成。
        </p>

        <div className="mt-5 max-w-[420px]">
          <SearchInput
            value={query}
            placeholder="搜索工具名称、功能或关键词…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge variant="brand">
            <Sparkles size={12} />
            {visibleTools.length} 个工具
          </Badge>
          <Badge>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
            快速跳转
          </Badge>
        </div>
      </section>

      {!keyword && favoriteTools.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Star size={13} className="text-fg-muted" />
            <span className="text-sm font-semibold tracking-[0.06em] text-fg-muted uppercase">
              我的收藏
            </span>
            <span className="text-xs text-fg-muted">{favoriteTools.length}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3">
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onOpen={open} />
            ))}
          </div>
        </section>
      ) : null}

      {groups.map((group) => (
        <section className="flex flex-col gap-3" key={group.category}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-[0.06em] text-fg-muted uppercase">
              {group.label}
            </span>
            <span className="text-xs text-fg-muted">{group.items.length}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3">
            {group.items.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onOpen={open} />
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 ? (
        <EmptyState
          icon={<Search size={20} />}
          title={query.trim() ? "没有找到匹配的工具" : "还没有注册任何工具"}
          description={
            query.trim()
              ? `没有与 “${query}” 相关的工具，换个关键词试试。`
              : "在 src/tools 下新建一个目录并默认导出 ToolModule，即可自动出现在这里。"
          }
        />
      ) : null}
    </div>
  );
}
