// MUI-based Badge component with Shadcn-compatible API
import * as React from "react";
import { Chip, ChipProps } from "@mui/material";

export interface BadgeProps extends Omit<ChipProps, 'variant' | 'label' | 'children'> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  children?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = "default", children, ...props }, ref) => {
    const muiVariant: ChipProps['variant'] = variant === "outline" ? "outlined" : "filled";
    
    const sx: ChipProps['sx'] = {
      ...(variant === "destructive" && {
        bgcolor: 'error.main',
        color: 'error.contrastText',
      }),
      ...(variant === "secondary" && {
        bgcolor: 'secondary.main',
        color: 'secondary.contrastText',
      }),
      ...props.sx,
    };

    return (
      <Chip
        ref={ref}
        label={children}
        variant={muiVariant}
        size="small"
        sx={sx}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
