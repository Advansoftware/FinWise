'use client';

import * as React from 'react';
import { TextField, type TextFieldProps, styled } from '@mui/material';
import { type Theme, type SxProps } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    minHeight: '80px',
    alignItems: 'flex-start',
    fontSize: theme.typography.pxToRem(16),
    [theme.breakpoints.up('sm')]: {
      fontSize: theme.typography.pxToRem(14),
    },
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(2, 3),
  },
}));

interface TextareaProps extends Omit<TextFieldProps, 'multiline' | 'variant'> {
  sx?: SxProps<Theme>;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ sx, ...props }, ref) => {
    return (
      <StyledTextField
        multiline
        minRows={3}
        variant="outlined"
        inputRef={ref}
        sx={sx}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
