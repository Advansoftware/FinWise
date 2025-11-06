// src/components/billing/plan-expiration-alert.tsx
'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import Link from "next/link";

export function PlanExpirationAlert() {
  const { isExpired, isExpiringSoon, daysUntilExpiration, plan } = usePlan();

  // Não mostrar para plano Básico
  if (plan === 'Básico') return null;

  if (isExpired) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Assinatura Expirada</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Seu plano {plan} expirou. Renove agora para continuar aproveitando todos os recursos.
          </span>
          <Link href="/billing">
            <Button size="sm" variant="destructive">
              Renovar Agora
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (isExpiringSoon && daysUntilExpiration !== null) {
    return (
      <Alert variant="default" className="mb-4 border-yellow-500/50 text-yellow-200">
        <Clock className="h-4 w-4 !text-yellow-400" />
        <AlertTitle>Renovação Próxima</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Seu plano {plan} vence em {daysUntilExpiration} {daysUntilExpiration === 1 ? 'dia' : 'dias'}. 
            Certifique-se de que seu método de pagamento está atualizado.
          </span>
          <Link href="/billing">
            <Button size="sm" variant="outline">
              Gerenciar Assinatura
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
