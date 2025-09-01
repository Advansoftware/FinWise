'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Básico',
    price: 'Grátis',
    description: 'Comece a organizar suas finanças com as ferramentas essenciais.',
    features: [
      'Até 50 transações manuais',
      'Categorização padrão',
      'Dashboard visual',
      'Suporte via comunidade',
    ],
    cta: 'Comece Agora',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: 'R$ 19,90',
    pricePeriod: '/mês',
    description: 'Para quem busca controle total e insights inteligentes.',
    features: [
      'Transações ilimitadas',
      'Importação de extratos (CSV/OFX)',
      'OCR de notas fiscais',
      'Assistente de IA e dicas avançadas',
      'Criação de categorias personalizadas',
      'Suporte prioritário por e-mail',
    ],
    cta: 'Assinar Pro',
    href: '#',
    recommended: true,
  },
  {
    name: 'Empresarial',
    price: 'R$ 49,90',
    pricePeriod: '/mês',
    description: 'Para pequenas empresas e freelancers gerenciarem suas finanças.',
    features: [
      'Todos os recursos do Pro',
      'Múltiplas "carteiras" ou projetos',
      'Relatórios de despesas',
      'Gestão de usuários (em breve)',
      'Suporte dedicado com gerente de conta',
    ],
    cta: 'Assinar Empresarial',
    href: '#',
  },
];


export default function LandingPage() {
  const handleSubscription = (planName: string) => {
    // TODO: Implementar a lógica de integração com o Google Pay.
    // Esta função seria o ponto de partida para chamar o SDK do Google Pay,
    // passando os detalhes do plano (preço, recorrência). Após o pagamento
    // bem-sucedido, o backend seria notificado para atualizar o plano do
    // usuário no Firestore.
    alert(`Iniciando fluxo de assinatura para o plano ${planName}. A integração real com o Google Pay é necessária.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 flex justify-between items-center border-b">
         <h1 className="text-2xl font-bold text-primary">FinWise</h1>
         <div>
            <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
            </Button>
             <Button asChild>
                <Link href="/signup">Cadastre-se Grátis</Link>
            </Button>
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <section className="py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary mb-4">
                Organize suas finanças com o poder da Inteligência Artificial.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                FinWise é a maneira mais inteligente de controlar seus gastos, obter insights e alcançar suas metas financeiras.
              </p>
              <Button size="lg" asChild>
                 <Link href="/signup">Comece agora, é grátis</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 md:py-32 w-full bg-muted/20">
            <div className="container px-4 md:px-6">
                 <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">Planos flexíveis para você</h2>
                 <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Escolha o plano perfeito para suas necessidades. Cancele quando quiser.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <Card key={plan.name} className={`flex flex-col ${plan.recommended ? 'border-primary shadow-lg' : ''}`}>
                    <CardHeader>
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        <div>
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.pricePeriod && <span className="text-muted-foreground">{plan.pricePeriod}</span>}
                        </div>
                        <ul className="space-y-3 text-left">
                        {plan.features.map((feature) => (
                            <li key={feature} className="flex items-center">
                            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                            </li>
                        ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant={plan.recommended ? 'default' : 'outline'} onClick={() => handleSubscription(plan.name)}>
                         {plan.cta}
                        </Button>
                    </CardFooter>
                    </Card>>
                ))}
                </div>
            </div>
        </section>
      </main>
      <footer className="text-center p-4 border-t text-sm text-muted-foreground">
        © {new Date().getFullYear()} FinWise. Todos os direitos reservados.
      </footer>
    </div>
  );
}
