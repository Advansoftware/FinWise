// src/app/contacts/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  alpha,
  Stack,
  Skeleton,
} from "@mui/material";
import { Users } from "lucide-react";

// Lazy load component that uses hooks requiring context
import dynamic from "next/dynamic";

const ContactManager = dynamic(
  () => import("@/components/bank-payment/contact-manager").then(mod => mod.ContactManager),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={300} /> }
);

export default function ContactsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={24} color="var(--mui-palette-primary-main)" />
          </Box>
          <Typography variant="h5" fontWeight={600}>
            Contatos PIX
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Gerencie seus contatos para pagamentos e transferências via PIX
        </Typography>
      </Box>

      {/* Contact Manager Component */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
          border: 1,
          borderColor: (theme) => alpha(theme.palette.divider, 0.1),
        }}
      >
        {mounted ? <ContactManager /> : <Skeleton variant="rounded" height={300} />}
      </Paper>
    </Box>
  );
}
