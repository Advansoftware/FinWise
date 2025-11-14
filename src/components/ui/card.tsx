'use client';

import * as React from "react"
import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent as MuiCardContent,
  CardContentProps as MuiCardContentProps,
  CardActions as MuiCardActions,
  CardActionsProps as MuiCardActionsProps,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Card principal com estilos customizados
const StyledCard = styled(MuiCard)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.custom.border}`,
  backgroundColor: theme.palette.custom.card,
  color: theme.palette.custom.cardForeground,
  boxShadow: theme.shadows[1],
}));

const Card = React.forwardRef<HTMLDivElement, MuiCardProps>(
  ({ ...props }, ref) => (
    <StyledCard ref={ref} {...props} />
  )
);
Card.displayName = "Card";

// CardHeader - container para título e descrição
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, sx, ...props }, ref) => (
    <MuiCardContent
      ref={ref}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 6,
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiCardContent>
  )
);
CardHeader.displayName = "CardHeader";

// CardTitle - tipografia para título
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="h4"
      component="h3"
      sx={{
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '-0.025em',
      }}
      {...props}
    >
      {children}
    </Typography>
  )
);
CardTitle.displayName = "CardTitle";

// CardDescription - tipografia para descrição
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="body2"
      component="p"
      sx={{
        color: 'custom.mutedForeground',
      }}
      {...props}
    >
      {children}
    </Typography>
  )
);
CardDescription.displayName = "CardDescription";

// CardContent - conteúdo principal do card
const CardContent = React.forwardRef<HTMLDivElement, MuiCardContentProps>(
  ({ sx, ...props }, ref) => (
    <MuiCardContent
      ref={ref}
      sx={{
        p: 6,
        pt: 0,
        ...sx,
      }}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

// CardFooter - rodapé do card (ações)
const CardFooter = React.forwardRef<HTMLDivElement, MuiCardActionsProps>(
  ({ sx, ...props }, ref) => (
    <MuiCardActions
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 6,
        pt: 0,
        ...sx,
      }}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
