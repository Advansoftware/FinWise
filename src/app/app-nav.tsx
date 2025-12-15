"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  alpha,
} from "@mui/material";
import {
  Home,
  History,
  Settings,
  FolderKanban,
  Upload,
  Gem,
  UserCircle,
  Target,
  Goal,
  Wallet,
  FileText,
  CreditCard,
  Calculator,
  Users,
  Landmark,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Painel", icon: Home },
  { href: "/transactions", label: "Transações", icon: History },
  { href: "/wallets", label: "Carteiras", icon: Wallet },
  { href: "/categories", label: "Categorias", icon: FolderKanban },
  { href: "/budgets", label: "Orçamentos", icon: Target },
  { href: "/goals", label: "Metas", icon: Goal },
  { href: "/installments", label: "Parcelamentos", icon: CreditCard },
  { href: "/bank-connections", label: "Open Finance", icon: Landmark },
  { href: "/contacts", label: "Contatos PIX", icon: Users },
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/tools", label: "Ferramentas", icon: Calculator },
  { href: "/import", label: "Importar", icon: Upload },
];

interface AppNavProps {
  onNavigate?: () => void;
}

export function AppNav({ onNavigate }: AppNavProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <List disablePadding>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const IconComponent = item.icon;

        return (
          <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              onClick={handleNavClick}
              selected={isActive}
              sx={{
                borderRadius: 2,
                py: 1,
                px: 1.5,
                transition: "all 0.2s ease-in-out",
                "&.Mui-selected": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
                  },
                },
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive ? "primary.main" : "text.secondary",
                }}
              >
                <IconComponent size={18} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
