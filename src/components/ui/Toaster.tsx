import { CircleAlert, CircleCheck, Info } from "lucide-react";

import { useToastStore } from "@/features/toast/store";
import type { ToastVariant } from "@/features/toast/store";

const ICONS: Record<ToastVariant, typeof Info> = {
  info: Info,
  success: CircleCheck,
  error: CircleAlert,
};

export function Toaster() {
  const items = useToastStore((state) => state.items);

  if (items.length === 0) return null;

  return (
    <div className="ot-toasts" role="status" aria-live="polite">
      {items.map((item) => {
        const Icon = ICONS[item.variant];
        return (
          <div key={item.id} className={`ot-toast ot-toast--${item.variant}`}>
            <Icon size={15} aria-hidden />
            <span>{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}
