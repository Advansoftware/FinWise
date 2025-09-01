"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";

interface ItemFilterProps {
  items: string[];
  selectedItem: string;
  onItemSelected: (item: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ItemFilter({ items, selectedItem, onItemSelected, className, placeholder, disabled = false }: ItemFilterProps) {
  
  // Garante que o item selecionado esteja na lista, caso contrário, reseta.
  React.useEffect(() => {
    if (!items.includes(selectedItem)) {
      onItemSelected('all');
    }
  }, [items, selectedItem, onItemSelected]);
  
  return (
    <div className={cn("grid gap-2", className)}>
        <Select value={selectedItem} onValueChange={onItemSelected} disabled={disabled}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "Selecione um item"} />
            </SelectTrigger>
            <SelectContent>
                {items.map((item) => (
                    <SelectItem key={item} value={item} className="capitalize">
                        {item === 'all' ? (placeholder || 'Todos') : item}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
  )
}
