// MUI-based Progress component with Shadcn-compatible API
import * as React from "react";
import { LinearProgress, LinearProgressProps, SxProps, Theme } from "@mui/material";

export interface ProgressProps extends Omit<LinearProgressProps, 'value'> {
  value?: number;
  indicatorSx?: SxProps<Theme>;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, indicatorSx, ...props }, ref) => {
    return (
      <LinearProgress
        ref={ref as any}
        variant="determinate"
        value={value}
        sx={{
          height: 8,
          borderRadius: 4,
          ...(indicatorSx && {
            '& .MuiLinearProgress-bar': indicatorSx
          }),
          ...props.sx
        }}
        {...props}
      />
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
