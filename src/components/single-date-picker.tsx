"use client"

import * as React from "react"
import { SxProps, Theme } from '@mui/material/styles'
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ptBR } from "date-fns/locale"

import { Button } from "@mui/material"
import { Calendar } from "@/components/mui-wrappers/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mui/material"

interface SingleDatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    sx?: SxProps<Theme>;
}

export function SingleDatePicker({ date, setDate, sx }: SingleDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
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
      </PopoverTrigger>
      <PopoverContent sx={{ width: 'auto', p: 0 }}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
}
