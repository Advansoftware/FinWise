"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { Box, useTheme, type SxProps, type Theme } from '@mui/material'
import { styled } from '@mui/material/styles'

const StyledCalendar = styled(DayPicker)(({ theme }) => ({
  padding: theme.spacing(3),
  
  '& .rdp-months': {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(4),
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
      gap: theme.spacing(4),
    },
  },
  
  '& .rdp-month': {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(4),
  },
  
  '& .rdp-caption': {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: theme.spacing(1),
    position: 'relative',
    alignItems: 'center',
  },
  
  '& .rdp-caption_label': {
    fontSize: theme.typography.pxToRem(14),
    fontWeight: theme.typography.fontWeightMedium,
  },
  
  '& .rdp-nav': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  
  '& .rdp-nav_button': {
    height: '1.75rem',
    width: '1.75rem',
    backgroundColor: 'transparent',
    padding: 0,
    opacity: 0.5,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: theme.transitions.create(['opacity', 'background-color', 'border-color']),
    '&:hover': {
      opacity: 1,
      backgroundColor: (theme.palette as any).custom?.accent,
      color: (theme.palette as any).custom?.accentForeground,
    },
  },
  
  '& .rdp-nav_button_previous': {
    position: 'absolute',
    left: theme.spacing(1),
  },
  
  '& .rdp-nav_button_next': {
    position: 'absolute',
    right: theme.spacing(1),
  },
  
  '& .rdp-table': {
    width: '100%',
    borderCollapse: 'collapse',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  
  '& .rdp-head_row': {
    display: 'flex',
  },
  
  '& .rdp-head_cell': {
    color: (theme.palette as any).custom?.mutedForeground,
    borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
    width: '2.25rem',
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.pxToRem(12.8),
  },
  
  '& .rdp-row': {
    display: 'flex',
    width: '100%',
    marginTop: theme.spacing(2),
  },
  
  '& .rdp-cell': {
    height: '2.25rem',
    width: '2.25rem',
    textAlign: 'center',
    fontSize: theme.typography.pxToRem(14),
    padding: 0,
    position: 'relative',
    '&:focus-within': {
      position: 'relative',
      zIndex: 20,
    },
    '&:has([aria-selected])': {
      backgroundColor: (theme.palette as any).custom?.accent,
    },
    '&:first-of-type:has([aria-selected])': {
      borderTopLeftRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
      borderBottomLeftRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
    },
    '&:last-of-type:has([aria-selected])': {
      borderTopRightRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
      borderBottomRightRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
    },
    '&:has([aria-selected].rdp-day_range_end)': {
      borderTopRightRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
      borderBottomRightRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
    },
    '&:has([aria-selected].rdp-day_outside)': {
      backgroundColor: `${(theme.palette as any).custom?.accent}80`,
    },
  },
  
  '& .rdp-day': {
    height: '2.25rem',
    width: '2.25rem',
    padding: 0,
    fontWeight: theme.typography.fontWeightRegular,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius : 4,
    transition: theme.transitions.create(['background-color', 'color']),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: (theme.palette as any).custom?.accent,
      color: (theme.palette as any).custom?.accentForeground,
    },
    '&[aria-selected]': {
      opacity: 1,
    },
  },
  
  '& .rdp-day_selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
    '&:focus': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  },
  
  '& .rdp-day_today': {
    backgroundColor: (theme.palette as any).custom?.accent,
    color: (theme.palette as any).custom?.accentForeground,
  },
  
  '& .rdp-day_outside': {
    color: (theme.palette as any).custom?.mutedForeground,
    '&[aria-selected]': {
      backgroundColor: `${(theme.palette as any).custom?.accent}80`,
      color: (theme.palette as any).custom?.mutedForeground,
    },
  },
  
  '& .rdp-day_disabled': {
    color: (theme.palette as any).custom?.mutedForeground,
    opacity: 0.5,
  },
  
  '& .rdp-day_range_middle': {
    '&[aria-selected]': {
      backgroundColor: (theme.palette as any).custom?.accent,
      color: (theme.palette as any).custom?.accentForeground,
    },
  },
  
  '& .rdp-day_hidden': {
    visibility: 'hidden',
  },
}))

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  sx?: SxProps<Theme>;
}

function Calendar({
  sx,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <Box sx={sx}>
      <StyledCalendar
        showOutsideDays={showOutsideDays}
        components={{
          IconLeft: (props) => (
            <ChevronLeft style={{ width: '1rem', height: '1rem' }} {...props} />
          ),
          IconRight: (props) => (
            <ChevronRight style={{ width: '1rem', height: '1rem' }} {...props} />
          ),
        }}
        {...props}
      />
    </Box>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
