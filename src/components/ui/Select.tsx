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
    <select
      className={cn("ot-select", className)}
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
  );
}
