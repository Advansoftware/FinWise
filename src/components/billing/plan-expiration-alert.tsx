// src/components/billing/plan-expiration-alert.tsx
'use client';

import { Alert, AlertDescription, AlertTitle } from "@mui/material";
import { Button } from "@mui/material";
import { AlertTriangle, Clock } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import Link from "next/link";

export function PlanExpirationAlert() {
  const { isExpired, isExpiringSoon, daysUntilExpiration, plan } = usePlan();

  // Não mostrar para plano Básico
  if (plan === 'Básico') return null;

  if (isExpired) {
    return (
      <Alert variant="contained" color="error" sx={{ mb: 2 }}>
        <AlertTriangle style={{ width: '1rem', height: '1rem' }} />
        <AlertTitle>Assinatura Expirada</AlertTitle>
        <AlertDescription sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            Seu plano {plan} expirou. Renove agora para continuar aproveitando todos os recursos.
          </span>
          <Link href="/billing">
            <Button size="small" variant="contained" color="error">
              Renovar Agora
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (isExpiringSoon && daysUntilExpiration !== null) {
    return (
      <Alert variant="default" sx={{ mb: 2, borderColor: 'rgba(234, 179, 8, 0.5)', color: '#fef08a' }}>
        <Clock style={{ width: '1rem', height: '1rem', color: '#facc15' }} />
        <AlertTitle>Renovação Próxima</AlertTitle>
        <AlertDescription sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            Seu plano {plan} vence em {daysUntilExpiration} {daysUntilExpiration === 1 ? 'dia' : 'dias'}. 
            Certifique-se de que seu método de pagamento está atualizado.
          </span>
          <Link href="/billing">
            <Button size="small" variant="outlined">
              Gerenciar Assinatura
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
