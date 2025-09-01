'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShieldCheck } from 'lucide-react';

export default function BillingPage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Faturamento</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura e veja seu histórico de pagamentos.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
          <CardDescription>Você está atualmente no plano gratuito.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border rounded-lg bg-card-foreground/5 text-center">
            <h2 className="text-2xl font-bold">Plano Gratuito</h2>
            <p className="text-4xl font-extrabold my-4">R$0<span className="text-base font-normal text-muted-foreground">/mês</span></p>
            <ul className="space-y-2 text-left my-6">
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Transações Ilimitadas</li>
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Análise com IA</li>
              <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Sincronização Offline</li>
            </ul>
            <Button size="lg" disabled>Seu Plano Atual</Button>
          </div>
        </CardContent>
      </Card>
        <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Ainda não há pagamentos registrados.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-8">
                <p>Quando você assinar um plano, seus pagamentos aparecerão aqui.</p>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
