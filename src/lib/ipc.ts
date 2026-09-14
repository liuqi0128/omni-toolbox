import { invoke } from "@tauri-apps/api/core";

/** 统一的原生调用错误，便于 UI 直接展示 message */
export class IpcError extends Error {
  readonly command: string;

  constructor(message: string, command: string) {
    super(message);
    this.name = "IpcError";
    this.command = command;
  }
}

function normalizeError(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
  }
  return "原生命令执行失败";
}

/** 是否运行在 Tauri 容器内（`vite dev` 直接开浏览器时为 false） */
export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * 调用 Rust 命令。所有跨端调用都应经由本函数，以便统一错误形态。
 */
export async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    throw new IpcError("当前不在 Tauri 运行环境中，无法调用原生能力。", command);
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new IpcError(normalizeError(error), command);
  }
}

/**
 * 把任意异常转成可展示的文案。
 */
export function toMessage(error: unknown): string {
  if (error instanceof IpcError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "发生未知错误";
}
