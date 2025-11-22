// MUI-based Input component with Shadcn-compatible API
import * as React from "react";
import { TextField, TextFieldProps } from "@mui/material";

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  variant?: "default" | "filled" | "outlined";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "outlined", size = "small", ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        variant="outlined"
        size={size}
        fullWidth
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
