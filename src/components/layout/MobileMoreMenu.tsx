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
  Smartphone,
  Calculator,
  Upload,
  User,
  Settings,
  Gem,
  X,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { href: "/categories", label: "Categorias", icon: FolderKanban },
  { href: "/budgets", label: "Orçamentos", icon: Target },
  { href: "/installments", label: "Parcelamentos", icon: CreditCard },
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/payments", label: "Pagamentos", icon: Smartphone },
  { href: "/tools", label: "Ferramentas", icon: Calculator },
  { href: "/import", label: "Importar", icon: Upload },
];

const accountItems = [
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/billing", label: "Assinatura", icon: Gem },
];

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleNavClick = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    router.push("/login");
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
          bgcolor: (theme) =>
            alpha(theme.palette.background.paper, 0.95),
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
          sx={{ px: 2, pt: 2, pb: 1, display: "block", color: "text.secondary" }}
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
                  component={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
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

        <Divider sx={{ my: 1 }} />

        <Typography
          variant="overline"
          sx={{ px: 2, pt: 1, pb: 1, display: "block", color: "text.secondary" }}
        >
          Conta
        </Typography>
        <List disablePadding>
          {accountItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);
            const IconComponent = item.icon;

            return (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (menuItems.length + index) * 0.05 }}
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

          {/* Logout */}
          <ListItem disablePadding>
            <ListItemButton
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (menuItems.length + accountItems.length) * 0.05 }}
              onClick={handleLogout}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 2,
                color: "error.main",
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText
                primary="Sair"
                primaryTypographyProps={{
                  color: "error.main",
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        {/* User info */}
        {user && (
          <Box
            sx={{
              mx: 2,
              mt: 2,
              mb: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              border: 1,
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Logado como
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.displayName || user.email}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "inline-block",
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              Plano {user.plan}
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
