"use client";

import { Chip, ChipProps } from "@mui/material";

interface StatusChipProps extends Omit<ChipProps, "color"> {
  value: string;
}

export function StatusChip({ value, sx, ...props }: StatusChipProps) {
  // Determine color type for styling - use static values to avoid hydration mismatch
  const getChipColor = (
    val: string
  ): "default" | "primary" | "secondary" | "info" => {
    switch (val) {
      case "0":
      case "Email":
      case "48h":
      case "Básico":
        return "default";
      case "Pro":
      case "24h":
      case "100":
      case "12h":
        return "info";
      case "Plus":
      case "300":
      case "Avançado":
      case "Prioritário":
        return "secondary";
      case "Infinity":
      case "500":
      case "4h":
      case "24/7":
        return "primary";
      default:
        return "primary";
    }
  };

  const chipColor = getChipColor(value);

  return (
    <Chip
      label={value}
      size="small"
      variant="filled"
      color={chipColor}
      {...props}
      sx={{
        fontWeight: 600,
        ...sx,
      }}
    />
  );
}
