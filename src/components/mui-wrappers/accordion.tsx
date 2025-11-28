// src/components/mui-wrappers/accordion.tsx
// MUI wrapper para Accordion
'use client';

import {
  Accordion as MuiAccordion,
  AccordionSummary,
  AccordionDetails,
  AccordionProps,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ReactNode } from 'react';

interface AccordionItemProps extends Omit<AccordionProps, 'children'> {
  value: string;
  children: NonNullable<ReactNode>;
}

export function Accordion({ children, ...props }: { children: ReactNode }) {
  return <>{children}</>;
}

export function AccordionItem({ children, value, ...props }: AccordionItemProps) {
  return (
    <MuiAccordion {...props}>
      {children}
    </MuiAccordion>
  );
}

export function AccordionTrigger({ children }: { children: ReactNode }) {
  return (
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>{children}</Typography>
    </AccordionSummary>
  );
}

export function AccordionContent({ children }: { children: ReactNode }) {
  return (
    <AccordionDetails>
      <Typography>{children}</Typography>
    </AccordionDetails>
  );
}
