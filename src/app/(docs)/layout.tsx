// src/app/(docs)/layout.tsx
'use client';

import { Logo } from "@/components/logo";
import Link from "next/link";
import { Button, Box, Container, AppBar, Toolbar, Typography, Stack } from "@mui/material";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
          <AppBar 
            position="sticky" 
            elevation={0}
            sx={{ 
              bgcolor: 'background.default', 
              borderBottom: 1, 
              borderColor: 'divider' 
            }}
          >
              <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 56 }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Logo sx={{ width: 32, height: 32 }} />
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        Gastometria
                      </Typography>
                    </Link>
                    <Button 
                      variant="contained" 
                      component={Link} 
                      href="/login"
                      size="small"
                    >
                        Acessar Painel
                    </Button>
                </Toolbar>
              </Container>
          </AppBar>
          <Box component="main" sx={{ flex: 1 }}>
            {children}
          </Box>
      </Box>
    </AuthGuard>
  );
}
