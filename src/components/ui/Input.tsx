import { Search } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends ComponentPropsWithRef<"input"> {
  /** 使用等宽字体 */
  mono?: boolean;
}

export function Input({ mono, className, ...rest }: InputProps) {
  return <input className={cn("ot-input", mono && "ot-input--mono", className)} {...rest} />;
}

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  mono?: boolean;
}

export function Textarea({ mono, className, ...rest }: TextareaProps) {
  return (
    <textarea className={cn("ot-textarea", mono && "ot-textarea--mono", className)} {...rest} />
  );
}

export interface SearchInputProps extends Omit<InputProps, "type"> {
  containerClassName?: string;
}

export function SearchInput({ containerClassName, ...rest }: SearchInputProps) {
  return (
    <div className={cn("ot-search", containerClassName)}>
      <Search size={14} className="ot-search__icon" aria-hidden />
      <Input type="search" {...rest} />
    </div>
  );
}
