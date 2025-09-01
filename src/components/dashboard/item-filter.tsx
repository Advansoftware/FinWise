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
}

export function ItemFilter({ items, selectedItem, onItemSelected, className }: ItemFilterProps) {
  return (
    <div className={cn("grid gap-2", className)}>
        <Select value={selectedItem} onValueChange={onItemSelected}>
            <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
                {items.map((item) => (
                    <SelectItem key={item} value={item} className="capitalize">
                        {item === 'all' ? 'Todas as Categorias' : item}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
  )
}
