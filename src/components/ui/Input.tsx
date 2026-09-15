import { Search } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/cn";

/** 输入类控件共用的外观 */
export const FIELD_CLASS =
  "w-full h-8 px-3 rounded-sm bg-inset border border-line text-fg text-base outline-none transition-[border-color,box-shadow] placeholder:text-fg-muted focus:border-brand focus:ring-[3px] focus:ring-brand-ring disabled:opacity-50";

export interface InputProps extends ComponentPropsWithRef<"input"> {
  /** 使用等宽字体 */
  mono?: boolean;
}

export function Input({ mono, className, ...rest }: InputProps) {
  return <input className={cn(FIELD_CLASS, mono && "font-mono text-sm", className)} {...rest} />;
}

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  mono?: boolean;
}

export function Textarea({ mono, className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        FIELD_CLASS,
        "h-auto min-h-24 py-3 leading-[1.65] resize-y",
        mono && "font-mono text-sm",
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
