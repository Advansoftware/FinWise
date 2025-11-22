// MUI-based Card component with Shadcn-compatible API
import * as React from "react";
import {
  Card as MuiCard,
  CardHeader as MuiCardHeader,
  CardContent as MuiCardContent,
  CardActions as MuiCardActions,
  CardProps as MuiCardProps,
  Typography,
  SxProps,
  Theme,
} from "@mui/material";

export interface CardProps extends MuiCardProps {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => {
    return <MuiCard ref={ref} {...props} />;
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <MuiCardHeader ref={ref} sx={sx} {...props}>
        {children}
      </MuiCardHeader>
    );
  }
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Typography ref={ref} variant="h6" component="h3" sx={sx} {...props}>
        {children}
      </Typography>
    );
  }
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Typography ref={ref} variant="body2" color="text.secondary" sx={sx} {...props}>
        {children}
      </Typography>
    );
  }
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }>(
  ({ sx, ...props }, ref) => {
    return <MuiCardContent ref={ref} sx={sx} {...props} />;
  }
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }>(
  ({ sx, ...props }, ref) => {
    return <MuiCardActions ref={ref} sx={sx} {...props} />;
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
