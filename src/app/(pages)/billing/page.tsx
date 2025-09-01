'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShieldCheck } from 'lucide-react';

export default function BillingPage() {
  const handleManageSubscription = () => {
    // TODO: Redirect to customer portal (e.g., Stripe Customer Portal)
    alert("Redirecionando para o portal de gerenciamento de assinaturas...");
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Assinatura</h1>
          <p className="text-muted-foreground">Gerencie seu plano e veja seu histórico de pagamentos.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Seu Plano Atual</CardTitle>
          <CardDescription>Você está atualmente no plano <span className="font-bold text-primary">Pro</span>.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="p-6 border rounded-lg bg-card-foreground/5 text-center flex flex-col">
            <h2 className="text-2xl font-bold">Plano Pro</h2>
            <p className="text-4xl font-extrabold my-4">R$19,90<span className="text-base font-normal text-muted-foreground">/mês</span></p>
            <ul className="space-y-2 text-left my-6 flex-1">
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Transações Ilimitadas</li>
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Análise com IA</li>
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Sincronização Offline</li>
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Importação e OCR</li>
            </ul>
            <Button onClick={handleManageSubscription}>Gerenciar Assinatura</Button>
          </div>
          <div className="space-y-4">
             <h3 className="font-semibold">Detalhes da Assinatura</h3>
             <div className="text-sm text-muted-foreground space-y-2">
                <p>Sua próxima cobrança será em <strong>15 de Julho de 2024</strong>.</p>
                <p>Seu método de pagamento é <span className="font-semibold">Google Pay</span>.</p>
             </div>
             <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex justify-between"><span>15 de Junho, 2024</span> <span>R$ 19,90</span></li>
                        <li className="flex justify-between"><span>15 de Maio, 2024</span> <span>R$ 19,90</span></li>
                        <li className="flex justify-between"><span>15 de Abril, 2024</span> <span>R$ 19,90</span></li>
                    </ul>
                </CardContent>
             </Card>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
