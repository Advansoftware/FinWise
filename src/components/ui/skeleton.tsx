'use client';

import { Box, type SxProps, type Theme, useTheme } from '@mui/material';
import * as React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>;
}

function Skeleton({
  sx,
  ...props
}: SkeletonProps) {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.custom.muted,
        '@keyframes pulse': {
          '0%, 100%': {
            opacity: 1,
          },
          '50%': {
            opacity: 0.5,
          },
        },
        ...(typeof sx === 'function' ? sx(theme) : sx),
      }}
      {...props}
    />
  );
}

export { Skeleton }
