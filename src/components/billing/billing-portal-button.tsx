// src/components/billing/billing-portal-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, Settings } from 'lucide-react';
import { usePayment } from '@/hooks/use-payment';
import { useAuth } from '@/hooks/use-auth';
import { usePlan } from '@/hooks/use-plan';
import { useToast } from '@/hooks/use-toast';
import { type SxProps, type Theme } from '@mui/material';

interface BillingPortalButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  showIcon?: boolean;
  disabled?: boolean;
}

export function BillingPortalButton({ 
  variant = 'outline', 
  size = 'default', 
  sx,
  children,
  showIcon = true,
  disabled = false
}: BillingPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { openCustomerPortal } = usePayment();
  const { user } = useAuth();
  const { plan } = usePlan();
  const { toast } = useToast();

  // Only show for paid plans
  const isPaidPlan = plan && plan !== 'Básico';

  const handlePortalAccess = async () => {
    if (!user) {
      toast({
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para acessar o portal.",
        variant: "destructive"
      });
      return;
    }

    if (!isPaidPlan) {
      toast({
        title: "Recurso Indisponível",
        description: "O portal de faturamento está disponível apenas para assinantes dos planos pagos.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await openCustomerPortal();
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render for free plan
  if (!isPaidPlan) {
    return null;
  }

  const defaultChildren = (
    <>
      {showIcon && (
        isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="mr-2 h-4 w-4" />
        )
      )}
      Gerenciar Assinatura
    </>
  );

  return (
    <Button
      onClick={handlePortalAccess}
      disabled={isLoading || disabled}
      variant={variant}
      size={size}
      sx={sx}
    >
      {children || defaultChildren}
    </Button>
  );
}