"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  Box,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  IconButton,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import { X } from "lucide-react";
import { DatePickerButton } from "@/components/date-picker-button";

interface DateRangePickerProps {
  initialDate?: DateRange;
  onUpdate: (range?: DateRange) => void;
}

export function DateRangePicker({
  initialDate,
  onUpdate,
}: DateRangePickerProps) {
  const [fromDate, setFromDate] = React.useState<Date | null>(
    initialDate?.from || null
  );
  const [toDate, setToDate] = React.useState<Date | null>(
    initialDate?.to || null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [tempFromDate, setTempFromDate] = React.useState<Date | null>(null);
  const [tempToDate, setTempToDate] = React.useState<Date | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Atualiza quando initialDate muda
  React.useEffect(() => {
    setFromDate(initialDate?.from || null);
    setToDate(initialDate?.to || null);
  }, [initialDate]);

  const handleOpenDialog = () => {
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleConfirm = () => {
    setFromDate(tempFromDate);
    setToDate(tempToDate);

    const newRange: DateRange | undefined = tempFromDate
      ? { from: tempFromDate, to: tempToDate || undefined }
      : undefined;

    onUpdate(newRange);
    setDialogOpen(false);
  };

  const handleClear = () => {
    setTempFromDate(null);
    setTempToDate(null);
  };

  // Quick select options
  const handleQuickSelect = (option: "today" | "week" | "month" | "year") => {
    const now = new Date();
    let from: Date;
    const to: Date = now;

    switch (option) {
      case "today":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        from = new Date(now.getFullYear(), 0, 1);
        break;
    }

    setTempFromDate(from);
    setTempToDate(to);
  };

  const formatButtonText = () => {
    if (!fromDate) return "Selecione um período";

    if (toDate) {
      return `${format(fromDate, "dd/MM/yy", { locale: ptBR })} - ${format(
        toDate,
        "dd/MM/yy",
        { locale: ptBR }
      )}`;
    }

    return format(fromDate, "dd MMM, yyyy", { locale: ptBR });
  };

  return (
    <>
      <TextField
        size="small"
        value={formatButtonText()}
        onClick={handleOpenDialog}
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <CalendarIcon size={18} />
              </InputAdornment>
            ),
            sx: { cursor: "pointer" },
          },
        }}
        sx={{ width: 200 }}
      />

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            overflow: "visible",
            minWidth: isMobile ? undefined : 400,
          },
        }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Selecionar Período</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <X size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ overflow: "visible" }}>
          <Stack spacing={3}>
            {/* Quick Select Buttons */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Seleção Rápida
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickSelect("today")}
                >
                  Hoje
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickSelect("week")}
                >
                  Últimos 7 dias
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickSelect("month")}
                >
                  Este mês
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickSelect("year")}
                >
                  Este ano
                </Button>
              </Stack>
            </Box>

            {/* Date Pickers */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Período Personalizado
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Data Inicial
                  </Typography>
                  <DatePickerButton
                    value={tempFromDate}
                    onChange={(newValue) => setTempFromDate(newValue)}
                    maxDate={tempToDate || undefined}
                    placeholder="Selecione a data inicial"
                    formatString="dd/MM/yyyy"
                  />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Data Final
                  </Typography>
                  <DatePickerButton
                    value={tempToDate}
                    onChange={(newValue) => setTempToDate(newValue)}
                    minDate={tempFromDate || undefined}
                    placeholder="Selecione a data final"
                    formatString="dd/MM/yyyy"
                  />
                </Box>
              </Stack>
            </Box>

            {/* Selected Range Preview */}
            {tempFromDate && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Período selecionado:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {format(tempFromDate, "dd/MM/yyyy", { locale: ptBR })}
                  {tempToDate &&
                    ` até ${format(tempToDate, "dd/MM/yyyy", {
                      locale: ptBR,
                    })}`}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClear} color="inherit">
            Limpar
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleConfirm} variant="contained">
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
