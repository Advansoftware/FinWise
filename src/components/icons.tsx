import type { TransactionCategory } from "@/lib/types";
import { Beer, Car, Film, HeartPulse, Home, ShoppingCart, Utensils } from "lucide-react";

export function CategoryIcon({ category, className }: { category: TransactionCategory, className?: string }) {
  const iconProps = { className: className || "h-4 w-4 text-muted-foreground" };
  
  switch (category) {
    case "Groceries":
      return <ShoppingCart {...iconProps} />;
    case "Transport":
      return <Car {...iconProps} />;
    case "Entertainment":
      return <Film {...iconProps} />;
    case "Utilities":
      return <Home {...iconProps} />;
    case "Beer":
      return <Beer {...iconProps} />;
    case "Dining":
      return <Utensils {...iconProps} />;
    case "Health":
      return <HeartPulse {...iconProps} />;
    default:
      return null;
  }
}
