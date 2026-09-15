import { ChevronDown } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/cn";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string = string> extends Omit<
  ComponentPropsWithRef<"select">,
  "onChange" | "value"
> {
  value: T;
  options: readonly SelectOption<T>[];
  onValueChange?: (value: T) => void;
}

export function Select<T extends string = string>({
  value,
  options,
  onValueChange,
  className,
  ...rest
}: SelectProps<T>) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "w-full h-8 pl-3 pr-8 rounded-sm bg-inset border border-line text-fg text-base cursor-pointer appearance-none outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-[3px] focus:ring-brand-ring disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        value={value}
        onChange={(event) => onValueChange?.(event.target.value as T)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted"
        aria-hidden
      />
    </div>
  );
}
