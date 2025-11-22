// MUI-based Calendar component with Shadcn-compatible API
import * as React from "react";
import {DayPicker, DayPickerProps} from 'react-day-picker';
import { Box, useTheme } from "@mui/material";
import 'react-day-picker/dist/style.css';

export type CalendarProps = DayPickerProps;

function Calendar({ className, ...props }: CalendarProps) {
  const theme = useTheme();

  return (
    <Box className={className}>
      <DayPicker
        showOutsideDays
        {...props}
        styles={{
          months: { display: 'flex', gap: '1rem' },
          month: { margin: 0 },
          caption: { 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '0.5rem',
            color: theme.palette.text.primary,
            fontWeight: 500,
          },
          day: {
            color: theme.palette.text.primary,
            borderRadius: theme.shape.borderRadius,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
          day_selected: {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          },
          day_today: {
            fontWeight: 'bold',
            color: theme.palette.primary.main,
          },
          day_outside: {
            color: theme.palette.text.disabled,
          },
          day_disabled: {
            color: theme.palette.text.disabled,
          },
          ...props.styles,
        }}
      />
    </Box>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
