// MUI-based Separator component with Shadcn-compatible API
import * as React from "react";
import { Divider, DividerProps } from "@mui/material";

export interface SeparatorProps extends DividerProps {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ orientation = "horizontal", decorative, ...props }, ref) => {
    return (
      <Divider
        ref={ref as any}
        orientation={orientation}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

export { Separator };
