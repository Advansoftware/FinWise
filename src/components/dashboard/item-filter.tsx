"use client"

import * as React from "react"
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface ItemFilterProps {
  items: string[];
  selectedItem: string;
  onItemSelected: (item: string) => void;
  className?: string;
}

export function ItemFilter({ items, selectedItem, onItemSelected, className }: ItemFilterProps) {
  return (
    <div className={cn("grid gap-2", className)}>
        <div className="bg-card p-1 rounded-lg border border-border flex items-center gap-1">
            {items.map((item) => (
                <Button
                    key={item}
                    variant={selectedItem.toLowerCase() === item.toLowerCase() ? "secondary" : "ghost"}
                    onClick={() => onItemSelected(item)}
                    className={cn(
                        "flex-1 capitalize transition-all duration-200",
                        {"bg-primary/10 text-primary shadow-sm": selectedItem.toLowerCase() === item.toLowerCase()}
                    )}
                >
                    {item === 'all' ? 'Todas as Categorias' : item}
                </Button>
            ))}
        </div>
    </div>
  )
}
