import { Command, Star } from "lucide-react";
import { useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { Button, Kbd } from "@/components/ui";
import { usePaletteStore } from "@/features/command-palette/store";
import { useFavoritesStore } from "@/features/favorites/store";
import { cn } from "@/lib/cn";
import { getTool } from "@/tools/registry";

const TOOL_PREFIX = "/tool/";

interface TopBarInfo {
  title: string;
  description: string;
  icon?: LucideIcon;
}

const STATIC_ROUTES: Record<string, TopBarInfo> = {
  "/": { title: "万象工具箱", description: "把日常用得到的小工具，都收进同一个窗口" },
  "/settings": { title: "设置", description: "外观、数据与偏好配置" },
  "/about": { title: "关于", description: "项目信息与快捷入口" },
};

function resolveInfo(pathname: string): TopBarInfo | undefined {
  if (pathname.startsWith(TOOL_PREFIX)) {
    const tool = getTool(pathname.slice(TOOL_PREFIX.length));
    if (tool) {
      return { title: tool.name, description: tool.description, icon: tool.icon };
    }
    return { title: "工具不存在", description: "该工具可能已被移除" };
  }

  return STATIC_ROUTES[pathname];
}

export function TopBar() {
  const location = useLocation();
  const setPaletteOpen = usePaletteStore((state) => state.setOpen);
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  const info = resolveInfo(location.pathname);
  const toolId = location.pathname.startsWith(TOOL_PREFIX)
    ? location.pathname.slice(TOOL_PREFIX.length)
    : null;
  const starred = toolId ? favoriteIds.includes(toolId) : false;
  const Icon = info?.icon;

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 truncate text-md leading-tight font-semibold">
          {Icon ? <Icon size={16} aria-hidden /> : null}
          {info?.title ?? "万象工具箱"}
        </div>
        <div className="truncate text-xs leading-snug text-fg-muted">{info?.description ?? ""}</div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {toolId ? (
          <button
            type="button"
            title={starred ? "取消收藏" : "收藏该工具"}
            aria-label={starred ? "取消收藏" : "收藏该工具"}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-sm transition-colors",
              starred ? "text-warning hover:bg-hover" : "text-fg-soft hover:bg-hover hover:text-fg",
            )}
            onClick={() => toggleFavorite(toolId)}
          >
            <Star size={16} fill={starred ? "currentColor" : "none"} />
          </button>
        ) : null}

        <Button variant="secondary" size="sm" onClick={() => setPaletteOpen(true)}>
          <Command size={14} />
          快速跳转
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </Button>
      </div>
    </header>
  );
}
