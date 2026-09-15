import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 前置图标 */
  icon?: ReactNode;
  /** 只显示图标（需自行提供 aria-label） */
  iconOnly?: boolean;
  /** 占满父容器宽度 */
  block?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-transparent font-medium whitespace-nowrap text-fg transition-[color,background-color,border-color,opacity] [&>svg]:pointer-events-none [&>svg]:shrink-0 active:enabled:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-[0.45]";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand border-brand text-on-brand hover:enabled:bg-brand-hover hover:enabled:border-brand-hover",
  secondary: "bg-elevated border-line hover:enabled:bg-hover hover:enabled:border-line-strong",
  ghost: "bg-transparent text-fg-soft hover:enabled:bg-hover hover:enabled:text-fg",
  danger: "bg-transparent border-transparent text-danger hover:enabled:bg-danger-soft",
};

/**
 * 尺寸与内边距必须互斥地生成。
 * 若同时输出 `px-3` 与 `p-0`，两者都是工具类、生成顺序不确定，
 * 一旦 `px-3` 生效，`w-8` 的按钮内容区只剩 8px，图标会被 flex 压缩。
 */
function sizeClass(size: ButtonSize, iconOnly: boolean): string {
  if (iconOnly) return size === "sm" ? "size-[26px] p-0" : "size-8 p-0";
  return size === "sm" ? "h-[26px] px-2 text-sm" : "h-8 px-3 text-base";
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconOnly = false,
  block = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        BASE,
        VARIANTS[variant],
        sizeClass(size, iconOnly),
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {icon}
      {iconOnly ? null : children}
    </button>
  );
}
