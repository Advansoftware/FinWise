"use client";

import { Box } from "@mui/material";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
          background: (theme) =>
            theme.palette.mode === "dark"
              ? `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
                 radial-gradient(ellipse 60% 40% at 80% 100%, rgba(120, 119, 198, 0.15), transparent),
                 ${theme.palette.background.default}`
              : `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.2), transparent),
                 radial-gradient(ellipse 60% 40% at 80% 100%, rgba(120, 119, 198, 0.1), transparent),
                 ${theme.palette.background.default}`,
        }}
      >
        <Box
          component="main"
          sx={{
            width: "100%",
            maxWidth: 480,
          }}
        >
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
}
