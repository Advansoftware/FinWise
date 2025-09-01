
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Gem } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Esta é uma função simulada. Em um app real, você usaria o SDK do Google Pay
  // ou de um processador de pagamento como o Stripe.
  const handleManageSubscription = () => {
    // Redireciona para uma página de gerenciamento de assinatura (ex: Stripe Customer Portal)
    alert("Gerenciamento de assinatura ainda não implementado.");
  };

  const getPlanDetails = () => {
    // Em um app real, o plano viria do seu banco de dados (Firestore)
    // Aqui estamos simulando que o usuário está no plano Pro.
    const userPlan = 'Pro';

    switch(userPlan) {
      case 'Pro':
        return {
          name: 'Pro',
          price: 'R$19,90/mês',
          features: [
            'Transações Ilimitadas',
            'Análise com IA',
            'Sincronização Offline',
            'Importação e OCR de Notas',
            'Categorias Personalizadas'
          ],
          nextBilling: '15 de Julho de 2024',
          paymentMethod: 'Google Pay'
        }
      default:
         return {
          name: 'Básico',
          price: 'Grátis',
          features: [
            'Até 50 transações manuais',
            'Categorização padrão',
            'Dashboard visual',
          ],
          nextBilling: 'N/A',
          paymentMethod: 'N/A'
        }
    }
  }

  const plan = getPlanDetails();


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
          <CardDescription>Você está atualmente no plano <span className="font-bold text-primary">{plan.name}</span>.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="p-6 border rounded-lg bg-card-foreground/5 text-center flex flex-col">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2"><Gem className="text-primary"/> Plano {plan.name}</h2>
            <p className="text-4xl font-extrabold my-4">{plan.price}</p>
            <ul className="space-y-2 text-left my-6 flex-1">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />{feature}</li>
              ))}
            </ul>
             {plan.name !== 'Básico' ? (
                <Button onClick={handleManageSubscription}>Gerenciar Assinatura</Button>
             ) : (
                <Button onClick={() => router.push('/')}>Ver Planos</Button>
             )}
          </div>
          <div className="space-y-4">
             <h3 className="font-semibold">Detalhes da Assinatura</h3>
             <div className="text-sm text-muted-foreground space-y-2">
                <p>Sua próxima cobrança será em <strong>{plan.nextBilling}</strong>.</p>
                <p>Seu método de pagamento é <span className="font-semibold">{plan.paymentMethod}</span>.</p>
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
