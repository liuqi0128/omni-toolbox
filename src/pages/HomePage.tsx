import { Search, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, SearchInput } from "@/components/ui";
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
    <button type="button" className="ot-toolcard" onClick={() => onOpen(tool.id)}>
      <span className="ot-toolcard__icon">
        <Icon size={17} aria-hidden />
      </span>
      <span className="ot-toolcard__body">
        <span className="ot-toolcard__name">{tool.name}</span>
        <span className="ot-toolcard__desc">{tool.description}</span>
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
    <div className="ot-home">
      <section className="ot-hero">
        <h1 className="ot-hero__title">{APP_NAME}</h1>
        <p className="ot-hero__desc">
          把日常用得到的小工具收进同一个窗口。新增工具只需在 <code>src/tools/</code>{" "}
          下建立目录，导航与路由会自动生成。
        </p>

        <div className="ot-hero__search">
          <SearchInput
            value={query}
            placeholder="搜索工具名称、功能或关键词…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="ot-hero__meta">
          <span className="ot-badge ot-badge--brand">
            <Sparkles size={12} />
            {visibleTools.length} 个工具
          </span>
          <span className="ot-badge">
            <span className="ot-kbd">Ctrl</span>
            <span className="ot-kbd">K</span>
            快速跳转
          </span>
        </div>
      </section>

      {!keyword && favoriteTools.length > 0 ? (
        <section className="ot-section">
          <div className="ot-section__head">
            <Star size={13} className="ot-muted" />
            <span className="ot-section__title">我的收藏</span>
            <span className="ot-section__count">{favoriteTools.length}</span>
          </div>
          <div className="ot-grid">
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onOpen={open} />
            ))}
          </div>
        </section>
      ) : null}

      {groups.map((group) => (
        <section className="ot-section" key={group.category}>
          <div className="ot-section__head">
            <span className="ot-section__title">{group.label}</span>
            <span className="ot-section__count">{group.items.length}</span>
          </div>
          <div className="ot-grid">
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
