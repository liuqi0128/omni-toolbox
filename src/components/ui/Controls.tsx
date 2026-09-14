import { cn } from "@/lib/cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, label, disabled }: SwitchProps) {
  return (
    <label className={cn("ot-switch", disabled && "ot-switch--disabled")}>
      <span
        className={cn("ot-switch__track", checked && "ot-switch__track--on")}
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
        <span className="ot-switch__thumb" />
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
    <div className={cn("ot-segmented", className)} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={cn(
            "ot-segmented__item",
            option.value === value && "ot-segmented__item--active",
          )}
          onClick={() => onValueChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
