// MUI-based Dialog component with Shadcn-compatible API
import * as React from "react";
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  DialogProps as MuiDialogProps,
  Typography,
  IconButton,
  Box,
  SxProps,
  Theme,
} from "@mui/material";
import { X } from "lucide-react";

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <DialogContext.Provider value={{ open: open || false, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<HTMLDivElement, { asChild?: boolean; children: React.ReactNode }>(
  ({ asChild, children }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return children;
    }
    return <div ref={ref}>{children}</div>;
  }
);

DialogTrigger.displayName = "DialogTrigger";

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }>(
  ({ children, className, sx, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    
    return (
      <MuiDialog
        open={context?.open || false}
        onClose={() => context?.onOpenChange?.(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx }}
      >
        <Box ref={ref} className={className} {...props}>
          {children}
        </Box>
      </MuiDialog>
    );
  }
);

DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Box ref={ref} sx={{ p: 3, pb: 2, ...sx }} {...props}>
        {children}
      </Box>
    );
  }
);

DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <MuiDialogTitle ref={ref} sx={{ p: 0, ...sx }} {...props}>
        {children}
      </MuiDialogTitle>
    );
  }
);

DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <Typography ref={ref} variant="body2" color="text.secondary" sx={{ mt: 1, ...sx }} {...props}>
        {children}
      </Typography>
    );
  }
);

DialogDescription.displayName = "DialogDescription";

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sx?: SxProps<Theme> }>(
  ({ children, sx, ...props }, ref) => {
    return (
      <MuiDialogActions ref={ref} sx={{ p: 3, pt: 2, ...sx }} {...props}>
        {children}
      </MuiDialogActions>
    );
  }
);

DialogFooter.displayName = "DialogFooter";

const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ children, asChild, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    
    const handleClick = () => context?.onOpenChange?.(false);
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        onClick: handleClick,
      });
    }
    
    return (
      <button
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DialogClose.displayName = "DialogClose";

// Context
const DialogContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void } | null>(null);

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose };
