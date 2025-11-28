"use client";

import * as React from "react";
import { SxProps, Theme } from "@mui/material/styles";
import { DatePickerButton } from "@/components/date-picker-button";

interface SingleDatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  sx?: SxProps<Theme>;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export function SingleDatePicker({
  date,
  setDate,
  sx,
  placeholder,
  minDate,
  maxDate,
  disabled,
}: SingleDatePickerProps) {
  return (
    <DatePickerButton
      value={date ?? null}
      onChange={(newDate) => setDate(newDate ?? undefined)}
      placeholder={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      sx={sx}
    />
  );
}
