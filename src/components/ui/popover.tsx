// MUI-based Popover component with Shadcn-compatible API
import * as React from "react";
import {
  Popover as MuiPopover,
  PopoverProps as MuiPopoverProps,
  Box,
  SxProps,
  Theme,
} from "@mui/material";

export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ open, onOpenChange, children }) => {
  return (
    <PopoverContext.Provider value={{ open: open || false, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef<HTMLDivElement, { asChild?: boolean; children: React.ReactNode }>(
  ({ asChild, children }, ref) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const context = React.useContext(PopoverContext);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
      context?.onOpenChange?.(true);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        onClick: handleClick,
        ref,
      });
    }

    return (
      <div ref={ref} onClick={handleClick}>
        {children}
      </div>
    );
  }
);

PopoverTrigger.displayName = "PopoverTrigger";

const PopoverAnchor = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    return <div ref={ref}>{children}</div>;
  }
);

PopoverAnchor.displayName = "PopoverAnchor";

const PopoverContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'center' | 'end';
  sx?: SxProps<Theme>;
  onOpenAutoFocus?: (event: Event) => void;
}>(
  ({ children, align = 'center', sx, onOpenAutoFocus, className, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
      // Find the trigger element
      const trigger = document.querySelector('[data-popover-trigger]');
      if (trigger) {
        setAnchorEl(trigger as HTMLElement);
      }
    }, []);

    return (
      <MuiPopover
        open={context?.open || false}
        anchorEl={anchorEl}
        onClose={() => context?.onOpenChange?.(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: align === 'start' ? 'left' : align === 'end' ? 'right' : 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: align === 'start' ? 'left' : align === 'end' ? 'right' : 'center',
        }}
      >
        <Box ref={ref} className={className} sx={{ p: 2, ...sx }} {...props}>
          {children}
        </Box>
      </MuiPopover>
    );
  }
);

PopoverContent.displayName = "PopoverContent";

// Context
const PopoverContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void } | null>(null);

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };
