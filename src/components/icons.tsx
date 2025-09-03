import type { TransactionCategory } from "@/lib/types";
import { Beef, Beer, Car, Film, HeartPulse, Home, ShoppingCart, Utensils, PiggyBank, Briefcase, TrendingUp } from "lucide-react";

export function CategoryIcon({ category, className }: { category: TransactionCategory, className?: string }) {
  const iconProps = { className: className || "h-4 w-4 text-muted-foreground" };
  
  switch (category) {
    case "Supermercado":
      return <ShoppingCart {...iconProps} />;
    case "Transporte":
      return <Car {...iconProps} />;
    case "Entretenimento":
      return <Film {...iconProps} />;
    case "Contas":
      return <Home {...iconProps} />;
    case "Restaurante":
      return <Utensils {...iconProps} />;
    case "Saúde":
      return <HeartPulse {...iconProps} />;
    case "Salário":
      return <Briefcase {...iconProps} />;
    case "Investimentos":
      return <TrendingUp {...iconProps} />;
    case "Vendas":
       return <PiggyBank {...iconProps} />;
    default:
      return null;
  }
}
