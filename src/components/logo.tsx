"use client";

import { SxProps, Theme, useTheme } from "@mui/material/styles";

export function Logo({ sx }: { sx?: SxProps<Theme> }) {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const chartColor =
    theme.palette.custom?.chart?.[2] || theme.palette.success.main;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", ...(sx as any) }}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
          id="logoGradientLight"
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
        fill="url(#logoGradientLight)"
      />

      {/* Main Bar Chart Element */}
      <g transform="translate(0 -5)">
        <rect
          x="28"
          y="60"
          width="12"
          height="30"
          rx="3"
          fill="url(#logoGradient)"
        />
        <rect
          x="44"
          y="40"
          width="12"
          height="50"
          rx="3"
          fill="url(#logoGradient)"
        />
        <rect
          x="60"
          y="50"
          width="12"
          height="40"
          rx="3"
          fill="url(#logoGradient)"
        />
      </g>

      {/* Brain/Wisdom Element */}
      <path
        d="M50,15 A15,15 0 0,1 65,30 H35 A15,15 0 0,1 50,15 Z"
        fill="url(#logoGradientLight)"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="50" cy="30" r="5" fill="url(#logoGradient)" />
    </svg>
  );
}
