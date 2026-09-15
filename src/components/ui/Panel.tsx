import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface PanelProps {
  className?: string;
  children: ReactNode;
}

export function Panel({ className, children }: PanelProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface",
        className,
      )}
    >
      {children}
    </section>
  );
}

export interface PanelHeadProps {
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PanelHead({ title, icon, actions, className }: PanelHeadProps) {
  return (
    <header
      className={cn(
        "flex h-[42px] shrink-0 items-center gap-3 border-b border-line bg-surface px-4",
        className,
      )}
    >
      <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.02em] whitespace-nowrap text-fg-soft">
        {icon}
        {title}
      </span>
      {actions ? <div className="ml-auto flex items-center gap-1">{actions}</div> : null}
    </header>
  );
}

export interface PanelBodyProps {
  children: ReactNode;
  /** 去掉内边距（用于列表、代码块铺满） */
  flush?: boolean;
  className?: string;
}

export function PanelBody({ children, flush = false, className }: PanelBodyProps) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-auto", flush ? "p-0" : "p-4", className)}>
      {children}
    </div>
  );
}
