"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import {Button, Popover, Box, useTheme} from '@mui/material';
import {DayPicker} from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  initialDate?: DateRange;
  onUpdate: (range?: DateRange) => void;
}

export function DateRangePicker({ className, initialDate, onUpdate }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(initialDate)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const theme = useTheme();

  React.useEffect(() => {
    onUpdate(date)
  }, [date, onUpdate])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: 'grid', gap: 2 }} className={className}>
      <Button
        id="date"
        variant="outlined"
        onClick={handleClick}
        startIcon={<CalendarIcon size={16} />}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          textAlign: 'left',
          fontWeight: 400,
          color: date ? 'text.primary' : 'text.secondary'
        }}
      >
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
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <DayPicker
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ptBR}
            styles={{
              months: { display: 'flex', gap: '1rem' },
              month: { margin: 0 },
              caption: { 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '0.5rem',
                color: theme.palette.text.primary
              },
              day: {
                color: theme.palette.text.primary,
                borderRadius: theme.shape.borderRadius,
              },
            }}
            modifiersStyles={{
              selected: {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              },
              today: {
                fontWeight: 'bold',
                color: theme.palette.primary.main,
              },
            }}
          />
        </Box>
      </Popover>
    </Box>
  )
}
