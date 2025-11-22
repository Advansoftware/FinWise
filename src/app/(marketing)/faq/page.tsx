import {Metadata} from 'next';
import Link from 'next/link';
import {ArrowLeft, HelpCircle, MessageCircle, Mail} from 'lucide-react';
import {Button, Typography} from '@mui/material';
import {Card, CardContent, CardHeader} from '@mui/material';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Chip} from '@mui/material';
import {Divider} from '@mui/material';
import {faqData} from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'FAQ - Perguntas Frequentes | Gastometria',
  description: 'Tire todas suas dúvidas sobre o Gastometria. Respostas para as perguntas mais frequentes sobre controle financeiro, IA, segurança e muito mais.',
  keywords: ['faq', 'dúvidas', 'perguntas frequentes', 'ajuda', 'suporte', 'tutorial', 'como usar'],
  openGraph: {
    title: 'FAQ - Perguntas Frequentes sobre Gastometria',
    description: 'Tire todas suas dúvidas sobre controle financeiro inteligente, IA, segurança e funcionalidades do Gastometria.',
    url: 'https://gastometria.com.br/faq',
  },
};

const faqCategories = [
  {
    id: 'geral',
    title: 'Geral',
    icon: HelpCircle,
    color: 'bg-blue-100 text-blue-800',
    questions: [
      {
        question: 'O que é o Gastometria?',
        answer: 'O Gastometria é uma plataforma de controle financeiro pessoal que utiliza inteligência artificial para ajudar você a gerenciar suas finanças de forma inteligente. Oferecemos dashboard interativo, categorização automática, relatórios com IA e muito mais.',
      },
      {
        question: 'O Gastometria é gratuito?',
        answer: 'Sim! Oferecemos um plano Básico gratuito com funcionalidades essenciais para controle financeiro. Para recursos avançados com IA, temos planos pagos a partir de R$ 19,90/mês.',
      },
      {
        question: 'Em quais dispositivos posso usar?',
        answer: 'O Gastometria é uma aplicação web progressiva (PWA) que funciona em qualquer dispositivo - computador, tablet ou smartphone. Você pode acessar pelo navegador ou instalar como aplicativo.',
      },
      {
        question: 'Preciso de conhecimento técnico para usar?',
        answer: 'Não! O Gastometria foi desenvolvido para ser intuitivo e fácil de usar. Nossa interface é amigável e oferecemos tutoriais para ajudar você a começar.',
      },
    ],
  },
  {
    id: 'ia',
    title: 'Inteligência Artificial',
    icon: MessageCircle,
    color: 'bg-purple-100 text-purple-800',
    questions: [
      {
        question: 'Como funciona a inteligência artificial?',
        answer: 'Nossa IA analisa seus padrões de gastos para gerar relatórios automáticos, sugerir orçamentos personalizados, categorizar transações automaticamente e fornecer insights financeiros através do assistente de chat.',
      },
      {
        question: 'A IA aprende com meus dados?',
        answer: 'Sim! A IA do Gastometria aprende continuamente com seus padrões de gasto para melhorar as categorizações automáticas e sugestões. Quanto mais você usa, mais precisa ela fica.',
      },
      {
        question: 'Como funciona o assistente de chat?',
        answer: 'O assistente de IA pode responder perguntas sobre suas finanças, gerar relatórios personalizados, dar dicas de economia e ajudar com análises financeiras específicas.',
      },
      {
        question: 'Posso treinar a IA?',
        answer: 'Sim! Você pode corrigir categorizações incorretas e a IA aprenderá com essas correções, tornando-se mais precisa ao longo do tempo.',
      },
    ],
  },
  {
    id: 'seguranca',
    title: 'Segurança e Privacidade',
    icon: Mail,
    color: 'bg-green-100 text-green-800',
    questions: [
      {
        question: 'Meus dados financeiros estão seguros?',
        answer: 'Absolutamente! Utilizamos criptografia de ponta, autenticação segura e seguimos as melhores práticas de segurança para proteger seus dados. Não compartilhamos informações pessoais com terceiros.',
      },
      {
        question: 'Como meus dados são armazenados?',
        answer: 'Seus dados são armazenados em servidores seguros com criptografia completa. Utilizamos autenticação multifator e acesso restrito para garantir máxima segurança.',
      },
      {
        question: 'Posso excluir minha conta e dados?',
        answer: 'Sim, você pode excluir sua conta a qualquer momento. Todos os seus dados serão permanentemente removidos dos nossos servidores conforme a LGPD.',
      },
      {
        question: 'Vocês vendem meus dados?',
        answer: 'Nunca! Seus dados financeiros são privados e não compartilhamos, vendemos ou utilizamos para outros fins além de oferecer o serviço do Gastometria.',
      },
    ],
  },
  {
    id: 'funcionalidades',
    title: 'Funcionalidades',
    icon: HelpCircle,
    color: 'bg-orange-100 text-orange-800',
    questions: [
      {
        question: 'Posso importar dados do meu banco?',
        answer: 'Sim! Suportamos importação de extratos bancários nos formatos CSV e OFX. Também oferecemos OCR para digitalizar notas fiscais automaticamente nos planos pagos.',
      },
      {
        question: 'Como funciona a categorização automática?',
        answer: 'Nossa IA analisa o título, valor e outros dados da transação para categorizá-la automaticamente. Você pode corrigir categorizações para treinar o sistema.',
      },
      {
        question: 'Posso criar múltiplas carteiras?',
        answer: 'Sim! Você pode criar quantas carteiras quiser para organizar diferentes contas bancárias, cartões de crédito ou categorias de dinheiro.',
      },
      {
        question: 'Como funcionam as metas financeiras?',
        answer: 'Você pode criar metas de economia com prazo e valor específicos. Nossa IA acompanha seu progresso e oferece dicas para alcançar seus objetivos.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqData),
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <Button variant="text" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Link>
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Perguntas Frequentes
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Encontre respostas para as dúvidas mais comuns sobre o Gastometria
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                      <category.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <Typography variant="h6" className="text-xl">{category.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.questions.length} perguntas
                      </Typography>
                    </div>
                    <Badge className={category.color}>
                      {category.questions.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="multiple" className="w-full">
                    {category.questions.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`${category.id}-${index}`}
                        className="border-b last:border-b-0 px-6"
                      >
                        <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          <Divider className="my-12" />

          {/* Contact Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Não encontrou a resposta que procurava?
              </h2>
              <p className="text-muted-foreground mb-6">
                Nossa equipe de suporte está sempre pronta para ajudar você
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="mailto:suporte@gastometria.com.br">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Link>
                </Button>
                <Button variant="outlined" asChild>
                  <Link href="/docs">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Ver Documentação
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <h3 className="text-xl font-semibold mb-4">
              Pronto para começar?
            </h3>
            <p className="text-muted-foreground mb-6">
              Experimente o Gastometria gratuitamente e transforme sua gestão financeira
            </p>
            <Button asChild size="large">
              <Link href="/signup">
                Criar Conta Grátis
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
