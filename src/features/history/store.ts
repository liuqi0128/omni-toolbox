import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storageKey } from "@/lib/storage";

/** 最近使用工具的最大保留数量 */
const MAX_HISTORY = 12;

interface HistoryState {
  ids: string[];
  push: (id: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      ids: [],
      push: (id) =>
        set((state) => ({
          ids: [id, ...state.ids.filter((item) => item !== id)].slice(0, MAX_HISTORY),
        })),
      clear: () => set({ ids: [] }),
    }),
    { name: storageKey("history") },
  ),
);
