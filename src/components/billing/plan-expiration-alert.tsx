// src/components/billing/plan-expiration-alert.tsx
'use client';

import { Alert, AlertTitle, Box } from "@mui/material";
import { Button } from "@mui/material";
import { usePlan } from "@/hooks/use-plan";
import Link from "next/link";

export function PlanExpirationAlert() {
  const { isExpired, isExpiringSoon, daysUntilExpiration, plan } = usePlan();

  // Não mostrar para plano Básico
  if (plan === 'Básico') return null;

  if (isExpired) {
    return (
      <Alert variant="filled" severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Assinatura Expirada</AlertTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>
            Seu plano {plan} expirou. Renove agora para continuar aproveitando todos os recursos.
          </span>
          <Link href="/billing">
            <Button size="small" variant="contained" color="inherit" sx={{ ml: 2, whiteSpace: 'nowrap' }}>
              Renovar Agora
            </Button>
          </Link>
        </Box>
      </Alert>
    );
  }

  if (isExpiringSoon && daysUntilExpiration !== null) {
    return (
      <Alert variant="outlined" severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>Renovação Próxima</AlertTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>
            Seu plano {plan} vence em {daysUntilExpiration} {daysUntilExpiration === 1 ? 'dia' : 'dias'}. 
            Certifique-se de que seu método de pagamento está atualizado.
          </span>
          <Link href="/billing">
            <Button size="small" variant="outlined" color="warning" sx={{ ml: 2, whiteSpace: 'nowrap' }}>
              Gerenciar Assinatura
            </Button>
          </Link>
        </Box>
      </Alert>
    );
  }

  return null;
}
