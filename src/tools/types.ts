import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

/**
 * 工具分类。新增分类只需在此追加，导航会自动生成分组。
 */
export type ToolCategory = "text" | "encode" | "crypto" | "time" | "dev" | "system";

export interface CategoryMeta {
  /** 分组标题 */
  label: string;
  /** 分组排序权重，越小越靠前 */
  order: number;
}

export const CATEGORIES: Record<ToolCategory, CategoryMeta> = {
  text: { label: "文本处理", order: 10 },
  encode: { label: "编码转换", order: 20 },
  crypto: { label: "加密与摘要", order: 30 },
  time: { label: "时间与日期", order: 40 },
  dev: { label: "开发辅助", order: 50 },
  system: { label: "系统信息", order: 60 },
};

/**
 * 工具元信息。位于 `src/tools/<id>/index.tsx` 的工具会被自动注册，
 * 无需在任何中心化文件中登记。
 */
export interface ToolMeta {
  /** 唯一标识，同时作为路由片段，建议 kebab-case */
  id: string;
  /** 工具名称（导航与标题展示） */
  name: string;
  /** 一句话描述，用于搜索与副标题 */
  description: string;
  category: ToolCategory;
  /** 图标组件（lucide-react） */
  icon: LucideIcon;
  /** 额外搜索关键词 */
  keywords?: string[];
  /** 排序权重，默认 100 */
  order?: number;
  /** 是否从导航与命令面板中隐藏 */
  hidden?: boolean;
}

/** 工具模块的默认导出结构 */
export interface ToolModule {
  meta: ToolMeta;
  component: ComponentType;
}

/** 供 UI 使用的工具条目 */
export interface ToolEntry extends ToolMeta {
  /** 规范化后的排序值 */
  order: number;
  /** 关键词 + 名称 + 描述拼成的检索串，供搜索复用 */
  searchText: string;
}
