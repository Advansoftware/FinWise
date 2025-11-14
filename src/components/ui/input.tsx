'use client';

import * as React from "react"
import {
  TextField,
  TextFieldProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Input baseado no TextField do MUI
export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  sx?: SxProps<Theme>;
  // Props HTML do input que queremos suportar
  min?: string | number;
  max?: string | number;
  step?: string | number;
  readOnly?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    height: '40px',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    fontSize: theme.typography.pxToRem(14),
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.custom.input,
      },
    },
    
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: '2px',
        borderColor: theme.palette.custom.ring,
      },
    },
    
    '&.Mui-disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.custom.input,
  },
  
  '& .MuiInputBase-input': {
    padding: '8px 12px',
    height: 'auto',
    
    '&::placeholder': {
      color: theme.palette.custom.mutedForeground,
      opacity: 1,
    },
    
    '&::file-selector-button': {
      border: 0,
      backgroundColor: 'transparent',
      fontSize: theme.typography.pxToRem(14),
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.palette.custom.foreground,
    },
  },
}));

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ sx, min, max, step, readOnly, ...props }, ref) => {
    return (
      <StyledTextField
        inputRef={ref}
        variant="outlined"
        fullWidth
        sx={sx}
        InputProps={{
          readOnly,
        }}
        inputProps={{
          min,
          max,
          step,
        }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input }
