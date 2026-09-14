import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storageKey } from "@/lib/storage";

interface SettingsState {
  /** 侧边栏是否折叠为图标模式 */
  sidebarCollapsed: boolean;
  /** 已折叠的分类分组 */
  collapsedGroups: string[];
  toggleSidebar: () => void;
  toggleGroup: (category: string) => void;
  reset: () => void;
}

const initialState = {
  sidebarCollapsed: false,
  collapsedGroups: [] as string[],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleGroup: (category) =>
        set((state) => ({
          collapsedGroups: state.collapsedGroups.includes(category)
            ? state.collapsedGroups.filter((item) => item !== category)
            : [...state.collapsedGroups, category],
        })),
      reset: () => set({ ...initialState }),
    }),
    { name: storageKey("settings") },
  ),
);
