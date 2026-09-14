import { ChevronRight, House, Monitor, Moon, PanelLeft, Settings, Star, Sun } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { SearchInput } from "@/components/ui";
import { useFavoritesStore } from "@/features/favorites/store";
import { useSettingsStore } from "@/features/settings/store";
import { useThemeStore } from "@/features/theme/store";
import type { ThemeMode } from "@/features/theme/store";
import { cn } from "@/lib/cn";
import { searchTools, toolGroups, visibleTools } from "@/tools/registry";
import type { ToolEntry } from "@/tools/types";

const TOOL_PREFIX = "/tool/";
const THEME_CYCLE: ThemeMode[] = ["system", "dark", "light"];
const THEME_ICONS: Record<ThemeMode, LucideIcon> = {
  system: Monitor,
  dark: Moon,
  light: Sun,
};
const THEME_LABELS: Record<ThemeMode, string> = {
  system: "主题：跟随系统",
  dark: "主题：深色",
  light: "主题：浅色",
};

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  toolId?: string;
}

function NavItem({ to, icon: Icon, label, collapsed, toolId }: NavItemProps) {
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const starred = toolId ? favoriteIds.includes(toolId) : false;

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn("ot-navitem", isActive && "ot-navitem--active")}
    >
      <Icon size={16} className="ot-navitem__icon" aria-hidden />
      {collapsed ? null : <span className="ot-navitem__text">{label}</span>}
      {!collapsed && toolId ? (
        <button
          type="button"
          title={starred ? "取消收藏" : "收藏"}
          aria-label={starred ? "取消收藏" : "收藏"}
          className={cn("ot-navitem__star", starred && "ot-navitem__star--on")}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(toolId);
          }}
        >
          <Star size={13} fill={starred ? "currentColor" : "none"} />
        </button>
      ) : null}
    </NavLink>
  );
}

export function Sidebar() {
  const navigate = useNavigate();

  const collapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar);
  const collapsedGroups = useSettingsStore((state) => state.collapsedGroups);
  const toggleGroup = useSettingsStore((state) => state.toggleGroup);

  const favoriteIds = useFavoritesStore((state) => state.ids);
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);

  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;
  const searchResults = searching ? searchTools(query) : [];
  const favoriteTools = favoriteIds
    .map((id) => visibleTools.find((tool) => tool.id === id))
    .filter((tool): tool is ToolEntry => Boolean(tool));

  const ThemeIcon = THEME_ICONS[themeMode];

  return (
    <aside className={cn("ot-sidebar", collapsed && "ot-sidebar--collapsed")}>
      <div className="ot-sidebar__brand">
        <img src="/logo.svg" alt="" className="ot-sidebar__logo" />
        {collapsed ? null : (
          <div className="ot-sidebar__title">
            <strong>万象工具箱</strong>
            <span>{visibleTools.length} 个工具</span>
          </div>
        )}
      </div>

      {collapsed ? null : (
        <div className="ot-sidebar__search">
          <SearchInput
            value={query}
            placeholder="搜索工具…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      )}

      <nav className="ot-sidebar__nav">
        <div className="ot-navgroup__items">
          <NavItem to="/" icon={House} label="首页" collapsed={collapsed} />
        </div>

        {searching ? (
          <div className="ot-navgroup">
            <div className="ot-navgroup__label">搜索结果</div>
            <div className="ot-navgroup__items">
              {searchResults.map((tool) => (
                <NavItem
                  key={tool.id}
                  to={`${TOOL_PREFIX}${tool.id}`}
                  icon={tool.icon}
                  label={tool.name}
                  collapsed={collapsed}
                  toolId={tool.id}
                />
              ))}
              {searchResults.length === 0 ? (
                <p className="ot-sidebar__empty">没有匹配的工具</p>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {favoriteTools.length > 0 ? (
              <div className="ot-navgroup">
                <div className="ot-navgroup__label">收藏</div>
                <div className="ot-navgroup__items">
                  {favoriteTools.map((tool) => (
                    <NavItem
                      key={tool.id}
                      to={`${TOOL_PREFIX}${tool.id}`}
                      icon={tool.icon}
                      label={tool.name}
                      collapsed={collapsed}
                      toolId={tool.id}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {toolGroups.map((group) => {
              const isCollapsed = collapsedGroups.includes(group.category);
              const expand = collapsed || !isCollapsed;

              return (
                <div className="ot-navgroup" key={group.category}>
                  {collapsed ? null : (
                    <button
                      type="button"
                      className="ot-navgroup__label"
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleGroup(group.category)}
                    >
                      <ChevronRight
                        size={12}
                        className={cn(
                          "ot-navgroup__chevron",
                          isCollapsed && "ot-navgroup__chevron--collapsed",
                        )}
                      />
                      {group.label}
                    </button>
                  )}
                  {expand ? (
                    <div className="ot-navgroup__items">
                      {group.items.map((tool) => (
                        <NavItem
                          key={tool.id}
                          to={`${TOOL_PREFIX}${tool.id}`}
                          icon={tool.icon}
                          label={tool.name}
                          collapsed={collapsed}
                          toolId={tool.id}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </>
        )}
      </nav>

      <div className="ot-sidebar__footer">
        <button
          type="button"
          className="ot-btn ot-btn--ghost ot-btn--icon"
          title={collapsed ? "展开侧边栏" : "折叠侧边栏"}
          aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
          onClick={toggleSidebar}
        >
          <PanelLeft size={16} />
        </button>
        <button
          type="button"
          className="ot-btn ot-btn--ghost ot-btn--icon"
          title={THEME_LABELS[themeMode]}
          aria-label={THEME_LABELS[themeMode]}
          onClick={() => {
            const next = THEME_CYCLE[(THEME_CYCLE.indexOf(themeMode) + 1) % THEME_CYCLE.length];
            setThemeMode(next);
          }}
        >
          <ThemeIcon size={16} />
        </button>
        <button
          type="button"
          className="ot-btn ot-btn--ghost ot-btn--icon"
          title="设置"
          aria-label="设置"
          onClick={() => void navigate("/settings")}
        >
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
}
