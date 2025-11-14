"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { type SxProps, type Theme, styled } from '@mui/material/styles';

const StyledLabel = styled(LabelPrimitive.Root)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(14),
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1,
  '&[data-disabled]': {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
}));

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  sx?: SxProps<Theme>;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ ...props }, ref) => (
  <StyledLabel
    ref={ref}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label }
