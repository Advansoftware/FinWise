// src/components/mui-wrappers/skeleton.tsx
// MUI wrapper para Skeleton
"use client";

import { Skeleton as MuiSkeleton, SkeletonProps } from "@mui/material";

export function Skeleton(props: SkeletonProps) {
  return <MuiSkeleton {...props} />;
}
