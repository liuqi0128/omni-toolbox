import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type FeedbackVariant = "info" | "success" | "warning" | "error";

const ALERT_ICONS: Record<FeedbackVariant, typeof Info> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

const ALERT_VARIANTS: Record<FeedbackVariant, string> = {
  info: "bg-info-soft text-info border-info",
  success: "bg-success-soft text-success border-success",
  warning: "bg-warning-soft text-warning border-warning",
  error: "bg-danger-soft text-danger border-danger",
};

export interface AlertProps {
  variant?: FeedbackVariant;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = "info", children, className }: AlertProps) {
  const Icon = ALERT_ICONS[variant];
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-sm border border-transparent p-3 text-sm",
        ALERT_VARIANTS[variant],
        className,
      )}
      role="alert"
    >
      <Icon size={15} className="mt-0.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 p-8 text-center text-fg-muted">
      {icon ? (
        <div className="flex size-11 items-center justify-center rounded-lg bg-hover text-fg-muted">
          {icon}
        </div>
      ) : null}
      <div className="text-md font-semibold text-fg-soft">{title}</div>
      {description ? (
        <div className="max-w-[380px] text-sm leading-relaxed">{description}</div>
      ) : null}
      {action}
    </div>
  );
}

export interface BadgeProps {
  variant?: "default" | "brand" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
  className?: string;
  title?: string;
}

const BADGE_VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-hover text-fg-soft",
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({ variant = "default", children, className, title }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-px text-xs font-medium whitespace-nowrap",
        BADGE_VARIANTS[variant],
        className,
      )}
      title={title}
    >
      {children}
    </span>
  );
}
