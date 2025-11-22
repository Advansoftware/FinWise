// src/components/mui-wrappers/scroll-area.tsx
// MUI wrapper para ScrollArea
'use client';

import { Box, BoxProps } from '@mui/material';

interface ScrollAreaProps extends BoxProps {
  children: React.ReactNode;
}

export function ScrollArea({ children, ...props }: ScrollAreaProps) {
  return (
    <Box
      {...props}
      sx={{
        overflowY: 'auto',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
}
