// MUI-based ToggleGroup component with Shadcn-compatible API
import * as React from "react";
import {
  ToggleButtonGroup,
  ToggleButton,
  ToggleButtonGroupProps,
  ToggleButtonProps,
} from "@mui/material";

export interface ToggleGroupProps extends Omit<ToggleButtonGroupProps, 'onChange'> {
  type?: "single" | "multiple";
  onValueChange?: (value: string | string[]) => void;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ type = "single", onValueChange, value, children, ...props }, ref) => {
    const handleChange = (event: React.MouseEvent<HTMLElement>, newValue: string | string[]) => {
      if (onValueChange && newValue !== null) {
        onValueChange(newValue);
      }
    };

    return (
      <ToggleButtonGroup
        ref={ref as any}
        value={value}
        exclusive={type === "single"}
        onChange={handleChange}
        {...props}
      >
        {children}
      </ToggleButtonGroup>
    );
  }
);

ToggleGroup.displayName = "ToggleGroup";

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <ToggleButton ref={ref} {...props}>
        {children}
      </ToggleButton>
    );
  }
);

ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
