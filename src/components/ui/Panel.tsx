import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface PanelProps {
  className?: string;
  children: ReactNode;
}

export function Panel({ className, children }: PanelProps) {
  return <section className={cn("ot-panel", className)}>{children}</section>;
}

export interface PanelHeadProps {
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PanelHead({ title, icon, actions, className }: PanelHeadProps) {
  return (
    <header className={cn("ot-panel__head", className)}>
      <span className="ot-panel__title">
        {icon}
        {title}
      </span>
      {actions ? <div className="ot-panel__actions">{actions}</div> : null}
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
    <div className={cn("ot-panel__body", flush && "ot-panel__body--flush", className)}>
      {children}
    </div>
  );
}
