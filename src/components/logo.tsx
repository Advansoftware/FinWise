"use client";

import { Box, SxProps, Theme, useTheme } from "@mui/material";
import { useId } from "react";

export function Logo({ sx }: { sx?: SxProps<Theme> }) {
  const theme = useTheme();
  const uniqueId = useId();
  const primaryColor = theme.palette.primary.main;
  const chartColor =
    theme.palette.custom?.chart?.[2] || theme.palette.success.main;

  const gradientId = `logoGradient-${uniqueId}`;
  const gradientLightId = `logoGradientLight-${uniqueId}`;

  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      sx={{
        width: "2rem",
        height: "2rem",
        flexShrink: 0,
        display: "block",
        ...sx,
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{ stopColor: primaryColor, stopOpacity: 1 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: chartColor, stopOpacity: 1 }}
          />
        </linearGradient>
        <linearGradient
          id={gradientLightId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            style={{ stopColor: primaryColor, stopOpacity: 0.1 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: chartColor, stopOpacity: 0.1 }}
          />
        </linearGradient>
      </defs>

      {/* Background shape */}
      <path
        d="M20,90 C20,90 20,20 50,10 C80,20 80,90 80,90 Z"
        fill={`url(#${gradientLightId})`}
      />

      {/* Main Bar Chart Element */}
      <g transform="translate(0 -5)">
        <rect
          x="28"
          y="60"
          width="12"
          height="30"
          rx="3"
          fill={`url(#${gradientId})`}
        />
        <rect
          x="44"
          y="40"
          width="12"
          height="50"
          rx="3"
          fill={`url(#${gradientId})`}
        />
        <rect
          x="60"
          y="50"
          width="12"
          height="40"
          rx="3"
          fill={`url(#${gradientId})`}
        />
      </g>

      {/* Brain/Wisdom Element */}
      <path
        d="M50,15 A15,15 0 0,1 65,30 H35 A15,15 0 0,1 50,15 Z"
        fill={`url(#${gradientLightId})`}
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="50" cy="30" r="5" fill={`url(#${gradientId})`} />
    </Box>
  );
}
