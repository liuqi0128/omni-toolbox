import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storageKey } from "@/lib/storage";

export type ThemeMode = "light" | "dark" | "system";

export const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
];

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      setMode: (mode) => set({ mode }),
    }),
    { name: storageKey("theme") },
  ),
);
