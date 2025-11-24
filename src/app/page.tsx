// src/app/page.tsx
"use client";

import React from 'react';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import { 
  Button, 
  Container, 
  Box, 
  Stack, 
  Typography, 
  Grid,
  Card, 
  CardContent, 
  CardHeader,
  Chip,
  AppBar,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import { ArrowRight, BarChart, Bot, LayoutDashboard, Wallet, Check, Goal, FolderKanban, Upload, KeyRound, CheckCircle, XCircle, HelpCircle, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import Image from "next/image";
import {Skeleton} from '@/components/mui-wrappers/skeleton';
import {AuthGuard} from '@/components/auth/auth-guard';
import {structuredData, organizationData, websiteData, breadcrumbData, faqData} from '@/lib/structured-data';
import Head from 'next/head';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar sua jornada financeira",
    features: [
      "Até 3 carteiras",
      "Transações ilimitadas",
      "Categorização manual",
      "Relatórios básicos",
      "Suporte por email"
    ],
    cta: "Começar Grátis",
    variant: "outlined",
    popular: false
  },
  {
    name: "Plus",
    price: "R$ 19,90",
    period: "/mês",
    description: "Para quem quer mais controle e insights",
    features: [
      "Carteiras ilimitadas",
      "IA para categorização",
      "OCR de notas fiscais",
      "Importação CSV/OFX",
      "Relatórios avançados",
      "Metas financeiras",
      "Suporte prioritário"
    ],
    cta: "Assinar Plus",
    variant: "contained",
    popular: true
  },
  {
    name: "Infinity",
    price: "R$ 39,90",
    period: "/mês",
    description: "Controle total com IA avançada",
    features: [
      "Tudo do Plus",
      "IA local (Ollama)",
      "Modelos personalizados",
      "API access",
      "Exportação ilimitada",
      "Análises preditivas",
      "Suporte 24/7"
    ],
    cta: "Assinar Infinity",
    variant: "contained",
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Soluções personalizadas para empresas",
    features: [
      "Tudo do Infinity",
      "Deploy on-premise",
      "SSO/SAML",
      "SLA garantido",
      "Treinamento dedicado",
      "Gerente de conta",
      "Customizações"
    ],
    cta: "Fale Conosco",
    variant: "outlined",
    popular: false
  }
];

const features = [
  {
    icon: Wallet,
    title: "Múltiplas Carteiras",
    description: "Organize seu dinheiro em carteiras separadas: pessoal, trabalho, investimentos e muito mais."
  },
  {
    icon: Bot,
    title: "IA Inteligente",
    description: "Categorização automática de transações com IA. Economize tempo e tenha insights precisos."
  },
  {
    icon: BarChart,
    title: "Relatórios Detalhados",
    description: "Visualize seus gastos com gráficos interativos e relatórios personalizáveis."
  },
  {
    icon: Goal,
    title: "Metas Financeiras",
    description: "Defina objetivos e acompanhe seu progresso rumo à independência financeira."
  },
  {
    icon: Upload,
    title: "Importação Fácil",
    description: "Importe extratos bancários (CSV/OFX) e digitalize notas fiscais com OCR."
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Intuitivo",
    description: "Interface moderna e fácil de usar. Acesse tudo que precisa em um só lugar."
  }
];

const faqs = [
  {
    question: "O Gastometria é gratuito?",
    answer: "Sim! Oferecemos um plano gratuito completo com recursos essenciais. Você pode fazer upgrade para Plus ou Infinity quando quiser mais funcionalidades."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Absolutamente. Usamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados financeiros são privados e protegidos."
  },
  {
    question: "Posso usar offline?",
    answer: "Sim! O Gastometria é um PWA (Progressive Web App) que funciona offline. Suas transações são sincronizadas quando você volta online."
  },
  {
    question: "Como funciona a IA?",
    answer: "Nossa IA analisa o histórico de transações e aprende seus padrões de gastos para categorizar automaticamente novas transações e fornecer insights personalizados."
  }
];

const blogPosts = [
  {
    title: "Como Economizar R$ 1000 por Mês",
    description: "Descubra estratégias práticas para reduzir gastos e aumentar sua poupança mensal.",
    category: "Economia",
    slug: "como-economizar-1000-por-mes"
  },
  {
    title: "Guia Completo de Investimentos para Iniciantes",
    description: "Tudo que você precisa saber para começar a investir com segurança.",
    category: "Investimentos",
    slug: "guia-investimentos-iniciantes"
  },
  {
    title: "Planejamento Financeiro Familiar",
    description: "Organize as finanças da família e alcance seus objetivos juntos.",
    category: "Planejamento",
    slug: "planejamento-financeiro-familiar"
  }
];

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Skeleton variant="rectangular" width="100%" height="100vh" />
      </Box>
    );
  }

  return (
    <AuthGuard>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      </Head>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header */}
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            bgcolor: 'background.default',
            backdropFilter: 'blur(12px)',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                <Logo sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                  Gastometria
                </Typography>
              </Link>
            </Box>
            
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="text" 
                  component={Link} 
                  href="/docs"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Documentação
                </Button>
                <Button 
                  variant="contained" 
                  component={Link} 
                  href={user ? "/dashboard" : "/login"}
                >
                  {user ? "Painel" : "Entrar"}
                </Button>
              </Stack>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box component="main" sx={{ flex: 1 }}>
          {/* Hero Section */}
          <Container maxWidth="lg" sx={{ py: { xs: 8, sm: 12, md: 16 } }}>
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Typography
                component={motion.h1}
                variant="h1"
                {...fadeIn}
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem', lg: '4rem' },
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.main}CC, ${theme.palette.primary.main}99)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2
                }}
              >
                Sua vida financeira, sob seu controle.
              </Typography>

              <Typography
                component={motion.p}
                variant="h6"
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: 0.2 }}
                sx={{
                  color: 'text.secondary',
                  maxWidth: '42rem',
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  lineHeight: 1.6
                }}
              >
                Gastometria une um design intuitivo com o poder da Inteligência Artificial para transformar a forma como você gerencia seu dinheiro.
              </Typography>

              <Box
                component={motion.div}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: 0.4 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  href={user ? "/dashboard" : "/login"}
                  endIcon={<ArrowRight />}
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  Comece Agora Gratuitamente
                </Button>
              </Box>

              <Box
                component={motion.div}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: 0.6 }}
                sx={{ width: '100%', maxWidth: '80rem', mt: { xs: 4, sm: 6, md: 8 } }}
              >
                <Paper 
                  elevation={8}
                  sx={{ 
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <Image
                    src="https://picsum.photos/1200/700"
                    alt="Dashboard Gastometria"
                    width={1200}
                    height={700}
                    data-ai-hint="dashboard finance"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    priority
                  />
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      background: (theme) => `linear-gradient(to top, ${theme.palette.background.default}, transparent)`
                    }}
                  />
                </Paper>
              </Box>
            </Stack>
          </Container>

          {/* Why Section */}
          <Box sx={{ py: { xs: 8, sm: 12, md: 16 }, bgcolor: 'background.paper' }}>
            <Container maxWidth="lg">
              <Box
                component={motion.div}
                {...fadeIn}
                sx={{ textAlign: 'center', mb: { xs: 6, sm: 8 } }}
              >
                <Typography variant="h2" sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem', md: '3rem' }, fontWeight: 700, mb: 2 }}>
                  Por que Gastometria?
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '48rem', mx: 'auto', fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Não se trata apenas de números e planilhas. Trata-se de trocar a ansiedade pela confiança. De saber exatamente para onde seu dinheiro vai, você ganha o poder de direcioná-lo para o que realmente importa: suas metas, seus sonhos e sua tranquilidade. O Gastometria foi criado para ser essa chave.
                </Typography>
              </Box>

              <Grid container spacing={4}>
                {features.map((feature, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Box
                      component={motion.div}
                      {...fadeIn}
                      transition={{ ...fadeIn.transition, delay: index * 0.1 }}
                    >
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ mb: 2, color: 'primary.main' }}>
                            <feature.icon size={32} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {feature.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* Pricing Section */}
          <Container maxWidth="lg" sx={{ py: { xs: 8, sm: 12, md: 16 } }}>
            <Box
              component={motion.div}
              {...fadeIn}
              sx={{ textAlign: 'center', mb: { xs: 6, sm: 8 } }}
            >
              <Typography variant="h2" sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem', md: '3rem' }, fontWeight: 700, mb: 2 }}>
                Planos e Preços
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '48rem', mx: 'auto', fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                Escolha o plano ideal para suas necessidades. Comece grátis e faça upgrade quando quiser.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {plans.map((plan, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
                  <Box
                    component={motion.div}
                    {...fadeIn}
                    transition={{ ...fadeIn.transition, delay: index * 0.1 }}
                    sx={{ height: '100%' }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        border: plan.popular ? 2 : 1,
                        borderColor: plan.popular ? 'primary.main' : 'divider'
                      }}
                    >
                      {plan.popular && (
                        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                          <Chip label="Mais Popular" color="primary" size="small" />
                        </Box>
                      )}
                      
                      <CardHeader
                        title={plan.name}
                        subheader={plan.description}
                        titleTypographyProps={{ variant: 'h5', fontWeight: 700 }}
                        subheaderTypographyProps={{ variant: 'body2' }}
                      />
                      
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h3" component="span" sx={{ fontWeight: 700 }}>
                            {plan.price}
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ color: 'text.secondary' }}>
                            {plan.period}
                          </Typography>
                        </Box>

                        <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                          {plan.features.map((feature, idx) => (
                            <Stack direction="row" spacing={1} key={idx}>
                              <Check size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                              <Typography variant="body2">{feature}</Typography>
                            </Stack>
                          ))}
                        </Stack>

                        <Button
                          variant={plan.variant as any}
                          size="large"
                          component={Link}
                          href={user ? "/dashboard" : "/login"}
                          fullWidth
                        >
                          {plan.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>

          {/* Feature Comparison Table */}
          <Box sx={{ py: { xs: 8, sm: 12, md: 16 }, bgcolor: 'background.paper' }}>
            <Container maxWidth="lg">
              <Box
                component={motion.div}
                {...fadeIn}
                sx={{ textAlign: 'center', mb: { xs: 6, sm: 8 } }}
              >
                <Typography variant="h2" sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem', md: '3rem' }, fontWeight: 700, mb: 2 }}>
                  Comparação de Recursos
                </Typography>
              </Box>

              <Paper sx={{ overflow: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Recurso</TableCell>
                      <TableCell align="center">Free</TableCell>
                      <TableCell align="center">Plus</TableCell>
                      <TableCell align="center">Infinity</TableCell>
                      <TableCell align="center">Enterprise</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Carteiras</TableCell>
                      <TableCell align="center">3</TableCell>
                      <TableCell align="center">Ilimitadas</TableCell>
                      <TableCell align="center">Ilimitadas</TableCell>
                      <TableCell align="center">Ilimitadas</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IA Categorização</TableCell>
                      <TableCell align="center"><XCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>OCR Notas Fiscais</TableCell>
                      <TableCell align="center"><XCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IA Local (Ollama)</TableCell>
                      <TableCell align="center"><XCircle size={20} /></TableCell>
                      <TableCell align="center"><XCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Deploy On-Premise</TableCell>
                      <TableCell align="center"><XCircle size={20} /></TableCell>
                      <TableCell align="center"><XCircle size={20} /></TableCell>
                      <TableCell align="center"><XCircle size={20} /></TableCell>
                      <TableCell align="center"><CheckCircle size={20} /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Container>
          </Box>

          {/* FAQ Section */}
          <Container maxWidth="lg" sx={{ py: { xs: 8, sm: 12, md: 16 } }}>
            <Box
              component={motion.div}
              {...fadeIn}
              sx={{ textAlign: 'center', mb: { xs: 6, sm: 8 } }}
            >
              <Typography variant="h2" sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem', md: '3rem' }, fontWeight: 700, mb: 2 }}>
                Perguntas Frequentes
              </Typography>
            </Box>

            <Stack spacing={3} sx={{ maxWidth: '48rem', mx: 'auto' }}>
              {faqs.map((faq, index) => (
                <Box
                  component={motion.div}
                  {...fadeIn}
                  transition={{ ...fadeIn.transition, delay: index * 0.1 }}
                  key={index}
                >
                  <Card>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <HelpCircle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {faq.question}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {faq.answer}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Stack>

            <Box
              component={motion.div}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.6 }}
              sx={{ textAlign: 'center', mt: 6 }}
            >
              <Button
                variant="outlined"
                size="large"
                component={Link}
                href="/faq"
                endIcon={<ChevronRight />}
              >
                Ver Todas as Perguntas
              </Button>
            </Box>
          </Container>

          {/* Blog Preview Section */}
          <Box sx={{ py: { xs: 8, sm: 12, md: 16 }, bgcolor: 'background.paper' }}>
            <Container maxWidth="lg">
              <Box
                component={motion.div}
                {...fadeIn}
                sx={{ textAlign: 'center', mb: { xs: 6, sm: 8 } }}
              >
                <Typography variant="h2" sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem', md: '3rem' }, fontWeight: 700, mb: 2 }}>
                  Aprenda Mais
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '48rem', mx: 'auto', fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Dicas, guias e insights para melhorar sua saúde financeira.
                </Typography>
              </Box>

              <Grid container spacing={4}>
                {blogPosts.map((post, index) => (
                  <Grid size={{ xs: 12, md: 4 }} key={index}>
                    <Box
                      component={motion.div}
                      {...fadeIn}
                      transition={{ ...fadeIn.transition, delay: index * 0.1 }}
                    >
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Chip label={post.category} size="small" sx={{ mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {post.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            {post.description}
                          </Typography>
                          <Button
                            variant="text"
                            size="small"
                            component={Link}
                            href={`/blog/${post.slug}`}
                            endIcon={<ArrowRight size={16} />}
                            sx={{ p: 0 }}
                          >
                            Ler artigo
                          </Button>
                        </CardContent>
                      </Card>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box
                component={motion.div}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: 0.6 }}
                sx={{ textAlign: 'center', mt: 6 }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  href="/blog"
                  endIcon={<ChevronRight />}
                >
                  Ver Todos os Artigos
                </Button>
              </Box>
            </Container>
          </Box>
        </Box>

        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 3,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
              © {new Date().getFullYear()} Gastometria. Todos os direitos reservados.
            </Typography>
          </Container>
        </Box>
      </Box>
    </AuthGuard>
  );
}
