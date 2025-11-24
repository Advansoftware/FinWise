// src/components/mui-wrappers/calendar.tsx
// MUI wrapper para Calendar usando DateCalendar
"use client";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { ptBR } from "date-fns/locale";

interface CalendarProps {
  mode?: "single" | "multiple" | "range";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  ...props
}: CalendarProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <DateCalendar
        value={selected}
        onChange={(newValue: Date | null) => {
          if (onSelect) {
            onSelect(newValue || undefined);
          }
        }}
        shouldDisableDate={disabled}
        {...props}
      />
    </LocalizationProvider>
  );
}
