import type { ReactNode } from "react";

/** 键盘按键提示 */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-xs border border-line bg-inset px-1 text-[10px] leading-none text-fg-muted">
      {children}
    </span>
  );
}
