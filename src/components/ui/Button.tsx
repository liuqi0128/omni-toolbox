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
        "ot-btn",
        `ot-btn--${variant}`,
        size === "sm" && "ot-btn--sm",
        iconOnly && "ot-btn--icon",
        block && "ot-btn--block",
        className,
      )}
      {...rest}
    >
      {icon}
      {iconOnly ? null : children}
    </button>
  );
}
