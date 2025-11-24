"use client";

import * as React from "react";
import { Select, MenuItem, FormControl, Box } from "@mui/material";

interface ItemFilterProps {
  items: string[];
  selectedItem: string;
  onItemSelected: (item: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ItemFilter({
  items,
  selectedItem,
  onItemSelected,
  placeholder,
  disabled = false,
}: ItemFilterProps) {
  React.useEffect(() => {
    if (!items.includes(selectedItem)) {
      onItemSelected("all");
    }
  }, [items, selectedItem, onItemSelected]);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <Select
          value={selectedItem}
          onChange={(e) => onItemSelected(e.target.value)}
          displayEmpty
        >
          {items.map((item) => (
            <MenuItem
              key={item}
              value={item}
              sx={{ textTransform: "capitalize" }}
            >
              {item === "all" ? placeholder || "Todos" : item}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
