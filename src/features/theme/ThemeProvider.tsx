import { useEffect } from "react";
import type { ReactNode } from "react";

import { useThemeStore } from "./store";

/**
 * 把主题模式同步到 <html data-theme>，CSS 变量据此切换。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved = mode === "system" ? (media.matches ? "dark" : "light") : mode;
      root.dataset.theme = resolved;
    };

    apply();

    if (mode !== "system") return undefined;

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);

  return children;
}
