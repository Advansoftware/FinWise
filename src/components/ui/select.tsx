// MUI-based Select component with Shadcn-compatible API
import * as React from "react";
import {
  Select as MuiSelect,
  MenuItem,
  FormControl,
  SelectProps as MuiSelectProps,
  SelectChangeEvent,
} from "@mui/material";

export interface SelectProps extends Omit<MuiSelectProps, 'onChange'> {
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, onValueChange, value, ...props }, ref) => {
    const handleChange = (event: SelectChangeEvent<unknown>) => {
      if (onValueChange) {
        onValueChange(event.target.value as string);
      }
    };

    return (
      <FormControl fullWidth size="small">
        <MuiSelect
          ref={ref as any}
          value={value}
          onChange={handleChange}
          {...props}
        >
          {children}
        </MuiSelect>
      </FormControl>
    );
  }
);

Select.displayName = "Select";

const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    // This is handled by MUI Select internally
    return null;
  }
);

SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef<HTMLSpanElement, { placeholder?: string }>(
  ({ placeholder }, ref) => {
    // This is handled by MUI Select internally
    return null;
  }
);

SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    // Content is rendered by MUI Select
    return <>{children}</>;
  }
);

SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<HTMLLIElement, { value: string; children: React.ReactNode }>(
  ({ value, children, ...props }, ref) => {
    return (
      <MenuItem value={value} ref={ref as any} {...props}>
        {children}
      </MenuItem>
    );
  }
);

SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
