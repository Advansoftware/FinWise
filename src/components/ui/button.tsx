// MUI-based Button component with Shadcn-compatible API
import * as React from "react";
import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    // Map Shadcn variants to MUI variants
    const muiVariant: MuiButtonProps['variant'] = 
      variant === "outline" ? "outlined" :
      variant === "ghost" || variant === "link" ? "text" :
      "contained";

    // Map Shadcn sizes to MUI sizes
    const muiSize: MuiButtonProps['size'] = 
      size === "sm" ? "small" :
      size === "lg" ? "large" :
      size === "icon" ? "small" :
      "medium";

    const sx: MuiButtonProps['sx'] = {
      ...(variant === "destructive" && {
        bgcolor: 'error.main',
        color: 'error.contrastText',
        '&:hover': {
          bgcolor: 'error.dark',
        },
      }),
      ...(variant === "secondary" && {
        bgcolor: 'secondary.main',
        color: 'secondary.contrastText',
        '&:hover': {
          bgcolor: 'secondary.dark',
        },
      }),
      ...(size === "icon" && {
        minWidth: 40,
        width: 40,
        height: 40,
        p: 1,
      }),
      ...props.sx,
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        ref,
      });
    }

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        size={muiSize}
        sx={sx}
        {...props}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = "Button";

export { Button };
