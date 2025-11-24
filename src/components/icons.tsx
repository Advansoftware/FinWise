import type { TransactionCategory } from "@/lib/types";
import { Box } from "@mui/material";
import {
  Car,
  Film,
  HeartPulse,
  Home,
  ShoppingCart,
  Utensils,
  PiggyBank,
  Briefcase,
  TrendingUp,
  LucideIcon,
} from "lucide-react";
import { SxProps, Theme } from "@mui/material/styles";
import { CSSProperties } from "react";

interface CategoryIconProps {
  category: TransactionCategory;
  sx?: SxProps<Theme>;
  style?: CSSProperties;
}

const defaultSx: SxProps<Theme> = {
  width: "1rem",
  height: "1rem",
  color: "text.secondary",
};

export function CategoryIcon({ category, sx, style }: CategoryIconProps) {
  const mergedSx = { ...defaultSx, ...sx };

  const iconMap: Record<string, LucideIcon> = {
    Supermercado: ShoppingCart,
    Transporte: Car,
    Entretenimento: Film,
    Contas: Home,
    Restaurante: Utensils,
    Saúde: HeartPulse,
    Salário: Briefcase,
    Investimentos: TrendingUp,
    Vendas: PiggyBank,
  };

  const IconComponent = iconMap[category];

  if (!IconComponent) {
    return null;
  }

  return <Box component={IconComponent} sx={mergedSx} style={style} />;
}
