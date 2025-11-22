// MUI-based Sheet component (Drawer) with Shadcn-compatible API
import * as React from "react";
import {
  Drawer,
  DrawerProps,
  Box,
  IconButton,
  Typography,
  SxProps,
  Theme,
} from "@mui/material";
import { X } from "lucide-react";

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return <>{children}</>;
};

const SheetTrigger = React.forwardRef<HTMLDivElement, { asChild?: boolean; children: React.ReactNode }>(
  ({ asChild, children }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return children;
    }
    return <div ref={ref}>{children}</div>;
  }
);

SheetTrigger.displayName = "SheetTrigger";

const SheetContent = React.forwardRef<HTMLDivElement, DrawerProps & { children: React.ReactNode; sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    const sheetContext = React.useContext(SheetContext);
    
    return (
      <Drawer
        anchor="right"
        open={sheetContext?.open || false}
        onClose={() => sheetContext?.onOpenChange?.(false)}
        {...props}
      >
        <Box
          ref={ref}
          sx={{
            width: { xs: '100%', sm: 400 },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            ...sx
          }}
        >
          {children}
        </Box>
      </Drawer>
    );
  }
);

SheetContent.displayName = "SheetContent";

const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Box ref={ref} sx={{ mb: 3, ...sx }} {...props}>
        {children}
      </Box>
    );
  }
);

SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Typography ref={ref} variant="h6" component="h2" sx={sx} {...props}>
        {children}
      </Typography>
    );
  }
);

SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Typography ref={ref} variant="body2" color="text.secondary" sx={sx} {...props}>
        {children}
      </Typography>
    );
  }
);

SheetDescription.displayName = "SheetDescription";

const SheetFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Box ref={ref} sx={{ mt: 'auto', pt: 3, ...sx }} {...props}>
        {children}
      </Box>
    );
  }
);

SheetFooter.displayName = "SheetFooter";

// Context to pass open state
const SheetContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void } | null>(null);

const SheetProvider: React.FC<SheetProps> = ({ open = false, onOpenChange, children }) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </SheetContext.Provider>
  );
};

// Wrap the main Sheet component
const SheetWrapper: React.FC<SheetProps> = (props) => {
  return <SheetProvider {...props} />;
};

export { SheetWrapper as Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter };
