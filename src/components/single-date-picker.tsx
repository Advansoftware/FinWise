"use client"

import * as React from "react"
import { SxProps, Theme } from '@mui/material/styles'
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ptBR } from "date-fns/locale"

import { Button, Popover } from "@mui/material"
import { Calendar } from "@/components/mui-wrappers/calendar"

interface SingleDatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    sx?: SxProps<Theme>;
}

export function SingleDatePicker({ date, setDate, sx }: SingleDatePickerProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleClick}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          textAlign: 'left',
          fontWeight: 'normal',
          ...((!date) && { color: theme => (theme.palette as any).custom?.mutedForeground }),
          ...sx
        }}
      >
        <CalendarIcon style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
        {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            setDate(newDate);
            handleClose();
          }}
        />
      </Popover>
    </>
  )
}
