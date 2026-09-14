import { Check, Copy } from "lucide-react";

import { useCopy } from "@/hooks/useCopy";

import { Button } from "./Button";
import type { ButtonSize, ButtonVariant } from "./Button";

export interface CopyButtonProps {
  value: string;
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  iconOnly?: boolean;
  disabled?: boolean;
}

export function CopyButton({
  value,
  label = "复制",
  size = "sm",
  variant = "ghost",
  iconOnly = false,
  disabled,
}: CopyButtonProps) {
  const { copy, copied } = useCopy();

  return (
    <Button
      size={size}
      variant={variant}
      iconOnly={iconOnly}
      disabled={disabled || !value}
      aria-label={label}
      title={label}
      icon={copied ? <Check size={14} /> : <Copy size={14} />}
      onClick={() => void copy(value)}
    >
      {copied ? "已复制" : label}
    </Button>
  );
}
