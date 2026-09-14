import clsx from "clsx";
import type { ClassValue } from "clsx";

/** 类名合并工具，统一从 @/lib/cn 引入 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** 生成 BEM 风格的类名：bem("ot-btn", "primary") -> "ot-btn--primary" */
export function bem(block: string, ...modifiers: (string | false | null | undefined)[]): string {
  return cn(
    block,
    modifiers.filter(Boolean).map((modifier) => `${block}--${modifier}`),
  );
}
