import { create } from "zustand";

export type ToastVariant = "info" | "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const DURATION = 2200;

let sequence = 0;

interface ToastState {
  items: ToastItem[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastState>()((set, get) => ({
  items: [],
  push: (message, variant = "info") => {
    const id = ++sequence;
    set((state) => ({ items: [...state.items, { id, message, variant }] }));
    window.setTimeout(() => get().dismiss(id), DURATION);
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));

/** 非组件环境下的快捷调用 */
export const toast = {
  info: (message: string) => useToastStore.getState().push(message, "info"),
  success: (message: string) => useToastStore.getState().push(message, "success"),
  error: (message: string) => useToastStore.getState().push(message, "error"),
};
