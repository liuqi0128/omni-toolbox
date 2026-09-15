import { cn } from "@/lib/cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, label, disabled }: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-line-strong",
        )}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            onCheckedChange(!checked);
          }
        }}
        onClick={() => {
          if (!disabled) onCheckedChange(!checked);
        }}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export interface SegmentedProps<T extends string = string> {
  value: T;
  options: readonly { value: T; label: string }[];
  onValueChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string = string>({
  value,
  options,
  onValueChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn("inline-flex gap-0.5 rounded-sm border border-line bg-inset p-0.5", className)}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "h-6 whitespace-nowrap rounded-xs px-3 text-sm transition-colors",
              active ? "bg-elevated font-medium text-fg shadow-sm" : "text-fg-soft hover:text-fg",
            )}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
