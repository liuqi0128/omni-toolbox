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

export interface AlertProps {
  variant?: FeedbackVariant;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = "info", children, className }: AlertProps) {
  const Icon = ALERT_ICONS[variant];
  return (
    <div className={cn("ot-alert", `ot-alert--${variant}`, className)} role="alert">
      <Icon size={15} aria-hidden />
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
    <div className="ot-empty">
      {icon ? <div className="ot-empty__icon">{icon}</div> : null}
      <div className="ot-empty__title">{title}</div>
      {description ? <div className="ot-empty__desc">{description}</div> : null}
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

export function Badge({ variant = "default", children, className, title }: BadgeProps) {
  return (
    <span
      className={cn("ot-badge", variant !== "default" && `ot-badge--${variant}`, className)}
      title={title}
    >
      {children}
    </span>
  );
}
