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
  label?: string;
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
  label,
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

  const handleOpen = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (newValue: Date | null) => {
    onChange(newValue);
    handleClose();
  };

  const displayText = value
    ? format(value, formatString, { locale: ptBR })
    : placeholder;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ width: fullWidth ? "100%" : "auto", ...sx }}>
        {/* Botão visível que o usuário clica */}
        <Button
          variant="outlined"
          onClick={handleOpen}
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

        {/* MobileDatePicker oculto - só abre quando o botão é clicado */}
        <MobileDatePicker
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          value={value}
          onChange={handleChange}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          label={label}
          slotProps={{
            textField: {
              sx: { display: "none" }, // Esconde o TextField padrão
            },
            dialog: {
              sx: {
                "& .MuiPickersLayout-root": {
                  backgroundColor: (theme) => theme.palette.background.paper,
                },
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
