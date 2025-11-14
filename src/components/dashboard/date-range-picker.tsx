"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Box } from '@mui/material';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  initialDate?: DateRange;
  onUpdate: (range?: DateRange) => void;
}

export function DateRangePicker({ className, initialDate, onUpdate }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(initialDate)

  React.useEffect(() => {
    onUpdate(date)
  }, [date, onUpdate])

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            sx={{
              width: '100%',
              justifyContent: 'flex-start',
              textAlign: 'left',
              fontWeight: 400,
              ...(!date && { color: 'text.secondary' })
            }}
          >
            <CalendarIcon style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent sx={{ width: 'auto', p: 0 }} align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </Box>
  )
}
