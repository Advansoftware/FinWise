"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { styled, type Theme, type SxProps } from '@mui/material/styles'
import { Box } from '@mui/material'

const Accordion = AccordionPrimitive.Root

const StyledAccordionItem = styled(AccordionPrimitive.Item)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  sx?: SxProps<Theme>;
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ sx, ...props }, ref) => (
  <StyledAccordionItem
    ref={ref}
    sx={sx}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const StyledAccordionTrigger = styled(AccordionPrimitive.Trigger)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(4, 0),
  fontWeight: theme.typography.fontWeightMedium,
  transition: theme.transitions.create(['text-decoration']),
  
  '&:hover': {
    textDecoration: 'underline',
  },
  
  '&[data-state=open] svg': {
    transform: 'rotate(180deg)',
  },
}))

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  sx?: SxProps<Theme>;
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ sx, children, ...props }, ref) => (
  <AccordionPrimitive.Header style={{ display: 'flex' }}>
    <StyledAccordionTrigger
      ref={ref}
      sx={sx}
      {...props}
    >
      {children}
      <ChevronDown 
        style={{ 
          width: '1rem', 
          height: '1rem', 
          flexShrink: 0, 
          transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)' 
        }} 
      />
    </StyledAccordionTrigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const StyledAccordionContent = styled(AccordionPrimitive.Content)(({ theme }) => ({
  overflow: 'hidden',
  fontSize: theme.typography.pxToRem(14),
  transition: theme.transitions.create(['max-height', 'opacity'], {
    duration: 200,
  }),
  
  '&[data-state=closed]': {
    animation: 'accordionUp 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '&[data-state=open]': {
    animation: 'accordionDown 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '@keyframes accordionDown': {
    from: {
      maxHeight: 0,
      opacity: 0,
    },
    to: {
      maxHeight: '200px',
      opacity: 1,
    },
  },
  
  '@keyframes accordionUp': {
    from: {
      maxHeight: '200px',
      opacity: 1,
    },
    to: {
      maxHeight: 0,
      opacity: 0,
    },
  },
}))

interface AccordionContentProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  sx?: SxProps<Theme>;
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ sx, children, ...props }, ref) => {

  
  return (
    <StyledAccordionContent
      ref={ref}
      {...props}
    >
      <Box sx={{ paddingBottom: 4, paddingTop: 0, ...sx }}>{children}</Box>
    </StyledAccordionContent>
  )
})

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
