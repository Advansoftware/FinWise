// MUI-based Alert component with Shadcn-compatible API
import * as React from "react";
import {
  Alert as MuiAlert,
  AlertTitle as MuiAlertTitle,
  AlertProps as MuiAlertProps,
  Typography,
  SxProps,
  Theme,
} from "@mui/material";

export interface AlertProps extends Omit<MuiAlertProps, 'variant'> {
  variant?: "default" | "destructive";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = "default", ...props }, ref) => {
    const severity = variant === "destructive" ? "error" : "info";
    
    return (
      <MuiAlert
        ref={ref}
        severity={severity}
        {...props}
      />
    );
  }
);

Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, ...props }, ref) => {
    return (
      <MuiAlertTitle ref={ref} {...props}>
        {children}
      </MuiAlertTitle>
    );
  }
);

AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Typography ref={ref} variant="body2" sx={sx} {...props}>
        {children}
      </Typography>
    );
  }
);

AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
