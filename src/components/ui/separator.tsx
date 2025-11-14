"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { Divider, type SxProps, type Theme, useTheme } from '@mui/material';

interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  sx?: SxProps<Theme>;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    { orientation = "horizontal", decorative = true, sx, ...props },
    ref
  ) => {
    const theme = useTheme();
    
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        asChild
      >
        <Divider
          orientation={orientation}
          sx={{
            flexShrink: 0,
            backgroundColor: theme.palette.custom.border,
            ...(orientation === "horizontal" 
              ? { height: '1px', width: '100%' } 
              : { height: '100%', width: '1px' }
            ),
            ...(typeof sx === 'function' ? sx(theme) : sx),
          }}
          {...props}
        />
      </SeparatorPrimitive.Root>
    );
  }
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator }
