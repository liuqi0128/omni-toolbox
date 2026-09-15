import { Search } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/cn";

/**
 * 输入类控件共用的外观。
 * 刻意不含尺寸（height / padding / font-size）：这些由各控件互斥指定，
 * 否则同一属性的工具类会互相覆盖，结果取决于 Tailwind 的生成顺序。
 */
const FIELD_SKIN =
  "w-full rounded-sm bg-inset border border-line text-fg outline-none transition-[border-color,box-shadow] placeholder:text-fg-muted focus:border-brand focus:ring-[3px] focus:ring-brand-ring disabled:opacity-50";

/** 等宽模式使用更小的字号 */
function textClass(mono?: boolean): string {
  return mono ? "font-mono text-sm" : "text-base";
}

export interface InputProps extends ComponentPropsWithRef<"input"> {
  /** 使用等宽字体 */
  mono?: boolean;
}

export function Input({ mono, className, ...rest }: InputProps) {
  return <input className={cn(FIELD_SKIN, "h-8 px-3", textClass(mono), className)} {...rest} />;
}

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  mono?: boolean;
}

export function Textarea({ mono, className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        FIELD_SKIN,
        "min-h-24 resize-y px-3 py-3 leading-[1.65]",
        textClass(mono),
        className,
      )}
      {...rest}
    />
  );
}

export interface SearchInputProps extends Omit<InputProps, "type"> {
  containerClassName?: string;
}

export function SearchInput({ containerClassName, className, ...rest }: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center", containerClassName)}>
      <Search size={14} className="pointer-events-none absolute left-3 text-fg-muted" aria-hidden />
      <Input type="search" className={cn("pl-8", className)} {...rest} />
    </div>
  );
}
