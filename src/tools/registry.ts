import { createElement } from "react";
import type { ComponentType, ReactElement } from "react";

import { CATEGORIES } from "./types";
import type { ToolCategory, ToolEntry, ToolModule } from "./types";

/** 默认排序权重 */
const DEFAULT_ORDER = 100;

/**
 * 自动发现工具：约定 `src/tools/<id>/index.tsx` **默认导出** ToolModule。
 * 新增工具 = 新增目录，注册、导航、路由、搜索全部自动完成。
 */
const discovered = import.meta.glob<{ default?: ToolModule }>("./*/index.tsx", {
  eager: true,
});

/**
 * 取出并校验模块的默认导出。
 * 注意：`import.meta.glob` 返回的是模块命名空间对象，工具数据位于 `default` 上。
 */
function resolveModules(): { path: string; module: ToolModule }[] {
  const valid: { path: string; module: ToolModule }[] = [];

  for (const [path, exports] of Object.entries(discovered)) {
    const toolModule = exports?.default;

    if (!toolModule?.meta || !toolModule?.component) {
      console.error(
        `[toolbox] 工具模块格式不合法，已跳过：${path}，请检查默认导出的 meta / component`,
      );
      continue;
    }

    valid.push({ path, module: toolModule });
  }

  return valid;
}

const resolvedModules = resolveModules();

function toEntry(module: ToolModule): ToolEntry {
  const { meta } = module;
  return {
    ...meta,
    order: meta.order ?? DEFAULT_ORDER,
    searchText: [meta.name, meta.description, meta.id, meta.category, ...(meta.keywords ?? [])]
      .join(" ")
      .toLowerCase(),
  };
}

function collect(modules: { path: string; module: ToolModule }[]): ToolEntry[] {
  const entries: ToolEntry[] = [];

  for (const { path, module } of modules) {
    const entry = toEntry(module);

    if (entries.some((item) => item.id === entry.id)) {
      console.error(`[toolbox] 工具 id 冲突，已跳过：${entry.id}（${path}）`);
      continue;
    }

    entries.push(entry);
  }

  return entries.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "zh-Hans-CN"));
}

/** 全部已注册工具（含 hidden，按 order 升序） */
export const tools: ToolEntry[] = collect(resolvedModules);

/** 组件索引：id -> 组件 */
export const toolComponents: Map<string, ComponentType> = new Map(
  resolvedModules.map(({ module }) => [module.meta.id, module.component]),
);

/** 导航中可见的工具 */
export const visibleTools: ToolEntry[] = tools.filter((tool) => !tool.hidden);

export interface ToolGroup {
  category: ToolCategory;
  label: string;
  order: number;
  items: ToolEntry[];
}

/** 按分类分组后的工具，空分组自动省略 */
export const toolGroups: ToolGroup[] = (Object.keys(CATEGORIES) as ToolCategory[])
  .map((category) => ({
    category,
    ...CATEGORIES[category],
    items: visibleTools.filter((tool) => tool.category === category),
  }))
  .filter((group) => group.items.length > 0)
  .sort((a, b) => a.order - b.order);

export function getTool(id: string): ToolEntry | undefined {
  return tools.find((tool) => tool.id === id);
}

export interface ToolRoute {
  id: string;
  path: string;
  element: ReactElement;
}

/**
 * 预生成工具路由。在模块加载时一次性完成组件实例化，
 * 避免在渲染期间动态查找组件。
 */
export const toolRoutes: ToolRoute[] = tools
  .filter((tool) => toolComponents.has(tool.id))
  .map((tool) => {
    const Component = toolComponents.get(tool.id) as ComponentType;
    return {
      id: tool.id,
      path: `tool/${tool.id}`,
      element: createElement(Component),
    };
  });

/** 模糊搜索：全部关键词命中即可，支持空格分词 */
export function searchTools(query: string): ToolEntry[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return visibleTools;

  const terms = keyword.split(/\s+/);
  return visibleTools.filter((tool) => terms.every((term) => tool.searchText.includes(term)));
}
