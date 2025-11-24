import {Metadata} from 'next';
import Link from 'next/link';
import {ArrowLeft, HelpCircle, MessageCircle, Mail, ChevronDown} from 'lucide-react';
import {
  Button, 
  Typography, 
  Container, 
  Box, 
  Stack, 
  Card, 
  CardContent, 
  CardHeader, 
  Chip, 
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
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
    color: 'info.main',
    bgcolor: 'info.lighter',
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
    color: 'secondary.main',
    bgcolor: 'secondary.lighter',
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
    color: 'success.main',
    bgcolor: 'success.lighter',
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
    color: 'warning.main',
    bgcolor: 'warning.lighter',
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqData),
        }}
      />
      
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Header */}
        <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
          <Button 
            variant="text" 
            component={Link} 
            href="/"
            startIcon={<ArrowLeft size={16} />}
            sx={{ mb: 3, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
          >
            Voltar ao Início
          </Button>

          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h2" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
                background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Perguntas Frequentes
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 400 }}>
              Encontre respostas para as dúvidas mais comuns sobre o Gastometria
            </Typography>
          </Box>

          {/* FAQ Categories */}
          <Stack spacing={4}>
            {faqCategories.map((category) => (
              <Card 
                key={category.id} 
                sx={{ 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8,
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '-2px'
                  }
                }}
              >
                <CardHeader 
                  sx={{ 
                    bgcolor: 'action.hover',
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 2, 
                          bgcolor: 'background.paper', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: category.color,
                          boxShadow: 1
                        }}
                      >
                        <category.icon size={20} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="bold">{category.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.questions.length} perguntas
                        </Typography>
                      </Box>
                      <Chip 
                        label={category.questions.length} 
                        size="small"
                        sx={{ 
                          bgcolor: category.color, 
                          color: 'white',
                          fontWeight: 'bold'
                        }} 
                      />
                    </Box>
                  }
                />
                <CardContent sx={{ p: 0 }}>
                  {category.questions.map((faq, index) => (
                    <Accordion 
                      key={index} 
                      disableGutters 
                      elevation={0}
                      sx={{ 
                        '&:before': { display: 'none' },
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 0 }
                      }}
                    >
                      <AccordionSummary 
                        expandIcon={<ChevronDown size={16} />}
                        sx={{ 
                          px: 3,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Typography fontWeight="medium">{faq.question}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                        <Typography color="text.secondary">
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Divider sx={{ my: 6 }} />

          {/* Contact Section */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              textAlign: 'center',
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.light}15, ${theme.palette.secondary.light}15)`,
              borderRadius: 4,
              border: 1,
              borderColor: 'divider'
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Não encontrou a resposta que procurava?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Nossa equipe de suporte está sempre pronta para ajudar você
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button 
                variant="contained" 
                size="large"
                component={Link} 
                href="mailto:suporte@gastometria.com.br"
                startIcon={<Mail size={18} />}
              >
                Enviar Email
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                component={Link} 
                href="/docs"
                startIcon={<HelpCircle size={18} />}
              >
                Ver Documentação
              </Button>
            </Stack>
          </Paper>

          {/* CTA Section */}
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Pronto para começar?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Experimente o Gastometria gratuitamente e transforme sua gestão financeira
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              component={Link} 
              href="/signup"
              sx={{ 
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                boxShadow: 4,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 8
                }
              }}
            >
              Criar Conta Grátis
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
