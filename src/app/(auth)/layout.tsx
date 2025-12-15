"use client";

import { Box } from "@mui/material";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {children}
    </Box>
  );
}
