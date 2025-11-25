"use client";

import * as React from "react";
import { SxProps, Theme } from "@mui/material/styles";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { Button, Box } from "@mui/material";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface DatePickerButtonProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
  formatString?: string;
}

/**
 * Componente reutilizável de seleção de data
 * Usa MobileDatePicker para consistência em todas as plataformas
 * Exibe um botão estilizado que abre o picker ao clicar
 */
export function DatePickerButton({
  value,
  onChange,
  placeholder = "Selecione uma data",
  minDate,
  maxDate,
  disabled = false,
  sx,
  fullWidth = true,
  size = "medium",
  formatString = "dd 'de' MMMM 'de' yyyy",
}: DatePickerButtonProps) {
  const [open, setOpen] = React.useState(false);

  const displayText = value
    ? format(value, formatString, { locale: ptBR })
    : placeholder;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ position: "relative", width: fullWidth ? "100%" : "auto" }}>
        {/* Botão visível que o usuário clica */}
        <Button
          variant="outlined"
          onClick={() => setOpen(true)}
          disabled={disabled}
          fullWidth={fullWidth}
          size={size}
          sx={{
            justifyContent: "flex-start",
            textAlign: "left",
            fontWeight: "normal",
            textTransform: "none",
            ...(!value && {
              color: (theme) => (theme.palette as any).custom?.mutedForeground,
            }),
            ...sx,
          }}
        >
          <CalendarIcon
            style={{
              marginRight: "0.5rem",
              width: "1.25rem",
              height: "1.25rem",
            }}
          />
          {displayText}
        </Button>

        {/* MobileDatePicker controlado */}
        <MobileDatePicker
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          value={value}
          onChange={(newValue) => {
            onChange(newValue);
          }}
          onAccept={() => setOpen(false)}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          slotProps={{
            textField: {
              sx: {
                position: "absolute",
                opacity: 0,
                pointerEvents: "none",
                width: 0,
                height: 0,
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
