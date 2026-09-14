import { useCallback, useEffect, useRef, useState } from "react";

import { useToastStore } from "@/features/toast/store";
import { copyText } from "@/lib/clipboard";

/**
 * 复制到剪贴板，并给出反馈。返回的 copied 用于短暂展示“已复制”状态。
 */
export function useCopy() {
  const push = useToastStore((state) => state.push);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string, label = "已复制到剪贴板") => {
      const ok = await copyText(text);
      push(ok ? label : "复制失败，请手动选择文本", ok ? "success" : "error");

      if (ok) {
        setCopied(true);
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopied(false), 1400);
      }

      return ok;
    },
    [push],
  );

  return { copy, copied };
}
