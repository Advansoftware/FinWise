// src/components/layout/MobileMoreMenu.tsx
// Menu "Mais" do bottom nav com todas as opções adicionais

"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  Divider,
  IconButton,
} from "@mui/material";
import {
  FolderKanban,
  Target,
  CreditCard,
  FileText,
  Calculator,
  Upload,
  X,
  Landmark,
  Users,
} from "lucide-react";
import { getFeatureFlags } from "@/lib/feature-flags";

const { openFinance: isOpenFinanceEnabled } = getFeatureFlags();

const baseMenuItems = [
  { href: "/categories", label: "Categorias", icon: FolderKanban },
  { href: "/budgets", label: "Orçamentos", icon: Target },
  { href: "/installments", label: "Parcelamentos", icon: CreditCard },
];

const openFinanceItems = isOpenFinanceEnabled
  ? [
      { href: "/bank-connections", label: "Open Finance", icon: Landmark },
      { href: "/contacts", label: "Contatos PIX", icon: Users },
    ]
  : [];

const menuItems = [
  ...baseMenuItems,
  ...openFinanceItems,
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/tools", label: "Ferramentas", icon: Calculator },
  { href: "/import", label: "Importar", icon: Upload },
];

// Itens de conta foram removidos pois já estão no menu do avatar (UserNav)

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "85vh",
          // Glass morphism
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        },
      }}
    >
      {/* Handle bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          pt: 1.5,
          pb: 1,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: "divider",
          }}
        />
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Menu
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </Box>

      <Divider />

      {/* Menu Items */}
      <Box sx={{ overflow: "auto", pb: "env(safe-area-inset-bottom)" }}>
        <Typography
          variant="overline"
          sx={{
            px: 2,
            pt: 2,
            pb: 1,
            display: "block",
            color: "text.secondary",
          }}
        >
          Recursos
        </Typography>
        <List disablePadding>
          {menuItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);
            const IconComponent = item.icon;

            return (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  onClick={() => handleNavClick(item.href)}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    bgcolor: isActive
                      ? (theme) => alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? "primary.main" : "text.secondary",
                    }}
                  >
                    <IconComponent size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "primary.main" : "text.primary",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Espaço extra no final */}
        <Box sx={{ height: 16 }} />
      </Box>
    </Drawer>
  );
}
