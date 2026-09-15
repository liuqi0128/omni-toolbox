import { CircleAlert, CircleCheck, Info } from "lucide-react";

import { useToastStore } from "@/features/toast/store";
import type { ToastVariant } from "@/features/toast/store";
import { cn } from "@/lib/cn";

const ICONS: Record<ToastVariant, typeof Info> = {
  info: Info,
  success: CircleCheck,
  error: CircleAlert,
};

const COLORS: Record<ToastVariant, string> = {
  info: "text-fg",
  success: "text-success",
  error: "text-danger",
};

export function Toaster() {
  const items = useToastStore((state) => state.items);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-5 bottom-5 z-[300] flex flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {items.map((item) => {
        const Icon = ICONS[item.variant];
        return (
          <div
            key={item.id}
            className={cn(
              "flex min-w-[180px] max-w-[340px] animate-toast-in items-center gap-2 rounded-md border border-line bg-elevated px-3 py-2 text-sm shadow-lg",
              COLORS[item.variant],
            )}
          >
            <Icon size={15} aria-hidden />
            <span>{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}
