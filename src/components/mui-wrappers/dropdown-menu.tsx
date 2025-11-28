// src/components/mui-wrappers/dropdown-menu.tsx
// MUI wrapper para substituir Radix UI DropdownMenu
"use client";

import {
  Menu,
  MenuItem,
  MenuProps,
  Box,
  Divider,
  Typography,
} from "@mui/material";
import { ReactNode, useState, cloneElement, isValidElement } from "react";

interface DropdownMenuProps {
  children: ReactNode;
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps extends Partial<MenuProps> {
  children: ReactNode;
  align?: "start" | "end";
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onSelect?: () => void;
  asChild?: boolean;
}

let triggerElement: HTMLElement | null = null;
let menuOpen = false;
let setMenuOpenFn: ((open: boolean) => void) | null = null;

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  setMenuOpenFn = (shouldOpen: boolean) => {
    if (shouldOpen && triggerElement) {
      setAnchorEl(triggerElement);
    } else {
      setAnchorEl(null);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {Array.isArray(children)
        ? children.map((child, index) => {
            if (isValidElement(child)) {
              if (child.type === DropdownMenuTrigger) {
                return cloneElement(child as any, {
                  key: index,
                  onClick: (e: React.MouseEvent<HTMLElement>) => {
                    triggerElement = e.currentTarget;
                    setAnchorEl(e.currentTarget);
                  },
                });
              }
              if (child.type === DropdownMenuContent) {
                return cloneElement(child as any, {
                  key: index,
                  anchorEl,
                  open,
                  onClose: handleClose,
                });
              }
            }
            return child;
          })
        : children}
    </>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
  ...props
}: DropdownMenuTriggerProps & any) {
  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, props);
  }
  return <Box {...props}>{children}</Box>;
}

export function DropdownMenuContent({
  children,
  align = "end",
  anchorEl,
  open,
  onClose,
  ...props
}: DropdownMenuContentProps & {
  anchorEl?: any;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open || false}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: align === "end" ? "right" : "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: align === "end" ? "right" : "left",
      }}
      {...props}
    >
      {children}
    </Menu>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  asChild,
  ...props
}: DropdownMenuItemProps & any) {
  const handleClick = () => {
    if (onSelect) onSelect();
    if (props.onClick) props.onClick();
    if (setMenuOpenFn) setMenuOpenFn(false);
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, { onClick: handleClick });
  }

  return <MenuItem onClick={handleClick}>{children}</MenuItem>;
}

interface DropdownMenuLabelProps {
  children: ReactNode;
}

export function DropdownMenuLabel({ children }: DropdownMenuLabelProps) {
  return (
    <Typography
      sx={{
        px: 2,
        py: 1.5,
        fontWeight: 500,
        fontSize: "0.875rem",
      }}
    >
      {children}
    </Typography>
  );
}

export function DropdownMenuSeparator() {
  return <Divider />;
}

export function DropdownMenuGroup({ children }: { children: ReactNode }) {
  return <Box>{children}</Box>;
}
