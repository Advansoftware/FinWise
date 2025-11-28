// src/components/mui-wrappers/sidebar.tsx
// MUI wrapper simplificado para Sidebar
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

interface SidebarContextValue {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [openMobile, setOpenMobile] = useState(false);
  const isMobile = false; // Simplificado

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setOpen(!open);
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        state: open ? 'expanded' : 'collapsed',
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children }: { children: ReactNode }) {
  return <Box>{children}</Box>;
}

export function SidebarContent({ children }: { children: ReactNode }) {
  return <Box sx={{ height: '100%', overflowY: 'auto' }}>{children}</Box>;
}

export function SidebarGroup({ children }: { children: ReactNode }) {
  return <Box sx={{ py: 2 }}>{children}</Box>;
}

export function SidebarGroupLabel({ children }: { children: ReactNode }) {
  return (
    <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}

export function SidebarMenu({ children }: { children: ReactNode }) {
  return <List>{children}</List>;
}

export function SidebarMenuItem({ children }: { children: ReactNode }) {
  return <ListItem disablePadding>{children}</ListItem>;
}

interface SidebarMenuButtonProps {
  asChild?: boolean;
  isActive?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export function SidebarMenuButton({ children, isActive, onClick }: SidebarMenuButtonProps) {
  return (
    <ListItemButton selected={isActive} onClick={onClick}>
      {children}
    </ListItemButton>
  );
}

export function SidebarHeader({ children }: { children: ReactNode }) {
  return <Box sx={{ p: 2 }}>{children}</Box>;
}

export function SidebarFooter({ children }: { children: ReactNode }) {
  return <Box sx={{ p: 2 }}>{children}</Box>;
}

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  return <button onClick={toggleSidebar}>Toggle</button>;
}
