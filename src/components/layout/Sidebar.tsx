import { ChevronRight, House, Monitor, Moon, PanelLeft, Settings, Star, Sun } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { Button, SearchInput } from "@/components/ui";
import { useFavoritesStore } from "@/features/favorites/store";
import { useSettingsStore } from "@/features/settings/store";
import { useThemeStore } from "@/features/theme/store";
import type { ThemeMode } from "@/features/theme/store";
import { cn } from "@/lib/cn";
import { searchTools, toolGroups, visibleTools } from "@/tools/registry";
import type { ToolEntry } from "@/tools/types";

const TOOL_PREFIX = "/tool/";
/** 侧边栏快捷切换只在深色 / 浅色间循环；「跟随系统」请在设置页选择 */
const THEME_CYCLE: ThemeMode[] = ["dark", "light"];
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

/** 分组标题与导航项共用的排版 */
const GROUP_LABEL_CLASS =
  "px-2 py-1 text-sm font-semibold tracking-[0.08em] text-fg-muted uppercase";

const NAV_ITEM_CLASS =
  "group flex h-[34px] w-full items-center gap-3 rounded-sm px-2 text-left text-md transition-colors";

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
      className={({ isActive }) =>
        cn(
          NAV_ITEM_CLASS,
          collapsed && "justify-center px-0",
          isActive
            ? "bg-brand-soft font-medium text-brand"
            : "text-fg-soft hover:bg-hover hover:text-fg",
        )
      }
    >
      <Icon size={16} className="shrink-0" aria-hidden />
      {collapsed ? null : <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && toolId ? (
        <button
          type="button"
          title={starred ? "取消收藏" : "收藏"}
          aria-label={starred ? "取消收藏" : "收藏"}
          className={cn(
            "shrink-0 text-warning transition-opacity",
            starred ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
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
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-line bg-surface transition-[width]",
        collapsed ? "w-[60px]" : "w-[244px]",
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 px-3">
        <img src="/logo.svg" alt="" className="size-7 shrink-0 rounded-sm" />
        {collapsed ? null : (
          <div className="flex min-w-0 flex-col leading-tight">
            <strong className="text-md font-semibold tracking-[0.02em] whitespace-nowrap">
              万象工具箱
            </strong>
          </div>
        )}
      </div>

      {collapsed ? null : (
        <div className="shrink-0 px-3 pb-3">
          <SearchInput
            value={query}
            placeholder="搜索工具…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-3">
        <div className="flex flex-col gap-0.5 pt-0.5">
          <NavItem to="/" icon={House} label="首页" collapsed={collapsed} />
        </div>

        {searching ? (
          <div className="pt-3">
            <div className={GROUP_LABEL_CLASS}>搜索结果</div>
            <div className="flex flex-col gap-0.5 pt-0.5">
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
                <p className="px-3 py-6 text-center text-sm text-fg-muted">没有匹配的工具</p>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {favoriteTools.length > 0 ? (
              <div className="pt-3">
                <div className={GROUP_LABEL_CLASS}>收藏</div>
                <div className="flex flex-col gap-0.5 pt-0.5">
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
                <div className="pt-3" key={group.category}>
                  {collapsed ? null : (
                    <button
                      type="button"
                      className={cn(
                        GROUP_LABEL_CLASS,
                        "flex w-full cursor-pointer items-center gap-2 select-none hover:text-fg-soft",
                      )}
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleGroup(group.category)}
                    >
                      <ChevronRight
                        size={12}
                        className={cn(
                          "transition-transform",
                          isCollapsed ? "rotate-0" : "rotate-90",
                        )}
                      />
                      {group.label}
                    </button>
                  )}
                  {expand ? (
                    <div className="flex flex-col gap-0.5 pt-0.5">
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

      <div
        className={cn(
          "flex shrink-0 items-center gap-1 border-t border-line py-2",
          collapsed ? "justify-center px-0" : "px-3",
        )}
      >
        <Button
          variant="ghost"
          iconOnly
          icon={<PanelLeft size={16} />}
          title={collapsed ? "展开侧边栏" : "折叠侧边栏"}
          aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
          onClick={toggleSidebar}
        />
        {/* 折叠态只保留展开按钮，其余入口收起，避免按钮溢出 60px 宽度 */}
        {collapsed ? null : (
          <>
            <Button
              variant="ghost"
              iconOnly
              icon={<ThemeIcon size={16} />}
              title={THEME_LABELS[themeMode]}
              aria-label={THEME_LABELS[themeMode]}
              onClick={() => {
                const next = THEME_CYCLE[(THEME_CYCLE.indexOf(themeMode) + 1) % THEME_CYCLE.length];
                setThemeMode(next);
              }}
            />
            <Button
              variant="ghost"
              iconOnly
              icon={<Settings size={16} />}
              title="设置"
              aria-label="设置"
              onClick={() => void navigate("/settings")}
            />
          </>
        )}
      </div>
    </aside>
  );
}
