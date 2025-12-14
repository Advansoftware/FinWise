// src/app/page.tsx
"use client";

import React from "react";
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
  Paper,
  TableContainer,
} from "@mui/material";
import { StatusChip } from "@/components/status-chip";
import {
  ArrowRight,
  BarChart,
  Bot,
  LayoutDashboard,
  Wallet,
  Check,
  Goal,
  Upload,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LazyMotion, domAnimation, m } from "framer-motion";
import Image from "next/image";
import {
  structuredData,
  organizationData,
  websiteData,
  breadcrumbData,
  faqData,
} from "@/lib/structured-data";
import Head from "next/head";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const plans = [
  {
    name: "Básico",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar sua jornada financeira",
    features: [
      "Até 3 carteiras",
      "Transações ilimitadas",
      "Categorização manual",
      "Relatórios básicos",
      "Suporte por email",
    ],
    cta: "Começar Grátis",
    variant: "outlined",
    popular: false,
    credits: "0 créditos IA",
  },
  {
    name: "Pro",
    price: "R$ 14,90",
    period: "/mês",
    description: "Recursos essenciais com IA",
    features: [
      "Tudo do Básico",
      "Carteiras ilimitadas",
      "100 créditos IA/mês",
      "IA para dicas rápidas",
      "Chat básico com IA",
      "Relatórios avançados",
    ],
    cta: "Assinar Pro",
    variant: "outlined",
    popular: false,
    credits: "100 créditos IA/mês",
  },
  {
    name: "Plus",
    price: "R$ 29,90",
    period: "/mês",
    description: "Poder completo da IA + Ollama",
    features: [
      "Tudo do Pro",
      "300 créditos IA/mês",
      "OCR de notas fiscais",
      "Importação CSV/OFX",
      "Ollama local (ilimitado)",
      "Metas financeiras",
      "Análises preditivas",
      "Suporte prioritário",
    ],
    cta: "Assinar Plus",
    variant: "contained",
    popular: true,
    credits: "300 créditos IA/mês",
  },
  {
    name: "Infinity",
    price: "R$ 49,90",
    period: "/mês",
    description: "Liberdade total com qualquer IA",
    features: [
      "Tudo do Plus",
      "500 créditos IA/mês",
      "OpenAI (sua chave)",
      "Google AI (sua chave)",
      "Qualquer provedor IA",
      "Uso ilimitado c/ suas chaves",
      "API access",
      "Suporte 24/7",
    ],
    cta: "Assinar Infinity",
    variant: "contained",
    popular: false,
    credits: "500 créditos IA/mês",
  },
];

const features = [
  {
    icon: Wallet,
    title: "Múltiplas Carteiras",
    description:
      "Organize seu dinheiro em carteiras separadas: pessoal, trabalho, investimentos e muito mais.",
    color: "#2196f3",
  },
  {
    icon: Bot,
    title: "IA Inteligente",
    description:
      "Categorização automática de transações com IA. Economize tempo e tenha insights precisos.",
    color: "#9c27b0",
  },
  {
    icon: BarChart,
    title: "Relatórios Detalhados",
    description:
      "Visualize seus gastos com gráficos interativos e relatórios personalizáveis.",
    color: "#ff9800",
  },
  {
    icon: Goal,
    title: "Metas Financeiras",
    description:
      "Defina objetivos e acompanhe seu progresso rumo à independência financeira.",
    color: "#4caf50",
  },
  {
    icon: Upload,
    title: "Importação Fácil",
    description:
      "Importe extratos bancários (CSV/OFX) e digitalize notas fiscais com OCR.",
    color: "#f44336",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Intuitivo",
    description:
      "Interface moderna e fácil de usar. Acesse tudo que precisa em um só lugar.",
    color: "#00bcd4",
  },
];

const faqs = [
  {
    question: "O Gastometria é gratuito?",
    answer:
      "Sim! Oferecemos um plano Básico completo com recursos essenciais. Você pode fazer upgrade para Pro, Plus ou Infinity quando quiser mais funcionalidades.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Absolutamente. Usamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados financeiros são privados e protegidos.",
  },
  {
    question: "Posso usar offline?",
    answer:
      "Sim! O Gastometria é um PWA (Progressive Web App) que funciona offline. Suas transações são sincronizadas quando você volta online.",
  },
  {
    question: "Como funcionam os créditos de IA?",
    answer:
      "Cada plano oferece créditos mensais para usar a Gastometria IA. Ações simples custam 1-2 créditos, complexas 5-10. Você pode usar Ollama (Plus) ou suas próprias chaves de IA (Infinity) ilimitadamente.",
  },
];

const blogPosts = [
  {
    title: "Como Economizar R$ 1000 por Mês",
    description:
      "Descubra estratégias práticas para reduzir gastos e aumentar sua poupança mensal.",
    category: "Economia",
    slug: "como-economizar-1000-por-mes",
    color: "#4caf50",
  },
  {
    title: "Guia Completo de Investimentos para Iniciantes",
    description:
      "Tudo que você precisa saber para começar a investir com segurança.",
    category: "Investimentos",
    slug: "guia-investimentos-iniciantes",
    color: "#2196f3",
  },
  {
    title: "Planejamento Financeiro Familiar",
    description:
      "Organize as finanças da família e alcance seus objetivos juntos.",
    category: "Planejamento",
    slug: "planejamento-financeiro-familiar",
    color: "#ff9800",
  },
];

// Tabela de comparação completa com recursos reais
const comparisonFeatures = [
  {
    category: "Carteiras & Transações",
    features: [
      {
        name: "Número de Carteiras",
        basico: "3",
        pro: "Ilimitadas",
        plus: "Ilimitadas",
        infinity: "Ilimitadas",
      },
      {
        name: "Transações",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Categorização Manual",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Transferências entre Carteiras",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Categorias Personalizadas",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
    ],
  },
  {
    category: "Parcelamentos & Gestão",
    features: [
      {
        name: "Criar Parcelamentos",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Acompanhar Pagamentos",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Cronograma de Vencimentos",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Projeções Mensais",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
    ],
  },
  {
    category: "Calculadoras Financeiras",
    features: [
      {
        name: "Calculadora de Férias",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Calculadora 13º Salário",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Projeção Salarial",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Calculadora FGTS",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Calculadora INSS",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Calculadora Rescisão",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Calculadora IR",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Empréstimo Consignado",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Pós-Férias",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
    ],
  },
  {
    category: "Folha de Pagamento",
    features: [
      {
        name: "Configurar Dados do Holerite",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Salário Bruto e Descontos",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Ajuda de Custo",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
    ],
  },
  {
    category: "Inteligência Artificial",
    features: [
      {
        name: "Créditos IA/mês",
        basico: "0",
        pro: "100",
        plus: "300",
        infinity: "500",
      },
      {
        name: "Dicas Rápidas (1 crédito)",
        basico: false,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Chat com IA",
        basico: false,
        pro: "Básico",
        plus: "Avançado",
        infinity: "Avançado",
      },
      {
        name: "Categorização Automática",
        basico: false,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Análise de Transações (5 créditos)",
        basico: false,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Gastometria IA (padrão)",
        basico: false,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Ollama Local (ilimitado)",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "OpenAI (sua chave)",
        basico: false,
        pro: false,
        plus: false,
        infinity: true,
      },
      {
        name: "Google AI (sua chave)",
        basico: false,
        pro: false,
        plus: false,
        infinity: true,
      },
    ],
  },
  {
    category: "Importação & Digitalização",
    features: [
      {
        name: "Importação CSV",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "Importação OFX",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "OCR Notas Fiscais (10 créditos)",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
    ],
  },
  {
    category: "Metas & Planejamento",
    features: [
      {
        name: "Metas Financeiras",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "Depósitos em Metas",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "Projeção de Metas (2 créditos)",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "Orçamentos",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "Sugestão de Orçamento IA (2 créditos)",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
    ],
  },
  {
    category: "Relatórios & Análises",
    features: [
      {
        name: "Dashboard Básico",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Relatórios Avançados",
        basico: false,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Análises Preditivas (5 créditos)",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "Previsão de Saldo (5 créditos)",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
      {
        name: "Exportação de Dados",
        basico: false,
        pro: false,
        plus: true,
        infinity: true,
      },
    ],
  },
  {
    category: "Offline & Sincronização",
    features: [
      {
        name: "Modo Offline (PWA)",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Sincronização Automática",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Cache Local (IndexedDB)",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
    ],
  },
  {
    category: "Suporte",
    features: [
      {
        name: "Tipo de Suporte",
        basico: "Email",
        pro: "Email",
        plus: "Prioritário",
        infinity: "24/7",
      },
      {
        name: "Tempo de Resposta",
        basico: "48h",
        pro: "24h",
        plus: "12h",
        infinity: "4h",
      },
    ],
  },
  {
    category: "API & Integrações",
    features: [
      {
        name: "Acesso à API REST v1",
        basico: false,
        pro: false,
        plus: false,
        infinity: true,
      },
      {
        name: "Documentação Interativa",
        basico: true,
        pro: true,
        plus: true,
        infinity: true,
      },
      {
        name: "Autenticação JWT",
        basico: false,
        pro: false,
        plus: false,
        infinity: true,
      },
      {
        name: "Endpoints de Carteiras",
        basico: false,
        pro: false,
        plus: false,
        infinity: true,
      },
      {
        name: "Endpoints de Transações",
        basico: false,
        pro: false,
        plus: false,
        infinity: true,
      },
      {
        name: "Endpoints de Metas/Orçamentos",
        basico: false,
        pro: false,
        plus: false,
        infinity: true,
      },
      {
        name: "Integração com Apps Externos",
        basico: false,
        pro: false,
        plus: false,
        infinity: true,
      },
    ],
  },
];

export default function Page() {
  // Auth routing is handled by middleware - no client-side checks needed

  const renderCellValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <CheckCircle size={24} style={{ color: "#4caf50" }} />
      ) : (
        <XCircle size={24} style={{ color: "#f44336" }} />
      );
    }
    if (typeof value === "string") {
      // Se for número de créditos, renderizar com chip
      if (value.includes("crédito") || !isNaN(Number(value))) {
        return <StatusChip value={value} />;
      }
      return <Typography variant="body2">{value}</Typography>;
    }
    return value;
  };

  return (
    <LazyMotion features={domAnimation}>
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

      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {/* Header */}
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            bgcolor: "background.default",
            backdropFilter: "blur(12px)",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box
              component={m.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Logo
                  sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1.125rem", sm: "1.25rem" },
                  }}
                >
                  Gastometria
                </Typography>
              </Link>
            </Box>

            <Box
              component={m.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Stack direction="row" spacing={2}>
                <Button
                  variant="text"
                  component={Link}
                  href="/docs"
                  sx={{ display: { xs: "none", sm: "inline-flex" } }}
                >
                  Documentação
                </Button>
                <Button
                  variant="text"
                  component={Link}
                  href="/api-docs"
                  sx={{ display: { xs: "none", md: "inline-flex" } }}
                >
                  API
                </Button>
                <Button variant="contained" component={Link} href="/login">
                  Entrar
                </Button>
              </Stack>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box component="main" sx={{ flex: 1 }}>
          {/* Hero Section */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              background: (theme) =>
                `radial-gradient(circle at 50% 50%, ${theme.palette.primary.main}15 0%, transparent 70%)`,
              // Full height minus header on desktop to fit screen perfectly
              minHeight: { xs: "auto", md: "calc(100vh - 80px)" }, // Adjusted to 80px to be safe with header
              height: { md: "calc(100vh - 80px)" }, // Force fix height on desktop to contain it
              display: "flex",
              alignItems: "center",
              py: { xs: 8, md: 0 }, // Remove padding on desktop as using flex center, keep for mobile
            }}
          >
            <Container maxWidth="xl">
              <Grid
                container
                spacing={{ xs: 6, md: 4, lg: 8 }}
                alignItems="center"
              >
                {/* Text Content */}
                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{ textAlign: { xs: "center", md: "left" }, zIndex: 2 }}
                >
                  <Stack spacing={4}>
                    <Box component={m.div} {...fadeIn}>
                      <Chip
                        label="Novo: Gestão com IA"
                        color="primary"
                        variant="outlined"
                        size="medium"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                          borderColor: "primary.main",
                        }}
                      />
                      <Typography
                        component="h1"
                        variant="h1"
                        sx={{
                          fontSize: {
                            xs: "2.5rem",
                            sm: "3.5rem",
                            md: "4rem",
                            lg: "4.5rem",
                          },
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.1,
                          mb: 2,
                          background: (theme) =>
                            `linear-gradient(135deg, ${theme.palette.text.primary} 30%, ${theme.palette.primary.main} 100%)`,
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Sua vida financeira, <br />
                        <Box
                          component="span"
                          sx={{
                            color: "primary.main",
                            WebkitTextFillColor: "initial",
                          }}
                        >
                          sob controle.
                        </Box>
                      </Typography>
                    </Box>

                    <Typography
                      component={m.p}
                      variant="h6"
                      {...fadeIn}
                      transition={{ ...fadeIn.transition, delay: 0.2 }}
                      sx={{
                        color: "text.secondary",
                        fontSize: { xs: "1.125rem", md: "1.25rem" },
                        lineHeight: 1.6,
                        maxWidth: { xs: "100%", md: "90%" },
                      }}
                    >
                      Pare de apenas anotar gastos. O{" "}
                      <strong>Gastometria</strong> usa Inteligência Artificial
                      para analisar, categorizar e te dizer exatamente como
                      atingir seus sonhos mais rápido.
                    </Typography>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      justifyContent={{ xs: "center", md: "flex-start" }}
                      component={m.div}
                      {...fadeIn}
                      transition={{ ...fadeIn.transition, delay: 0.4 }}
                    >
                      <Button
                        variant="contained"
                        size="large"
                        component={Link}
                        href="/login"
                        endIcon={<ArrowRight />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontSize: "1.125rem",
                          fontWeight: 700,
                          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                          },
                        }}
                      >
                        Começar Grátis
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        component={Link}
                        href="/docs"
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontSize: "1rem",
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 },
                        }}
                      >
                        Ver Documentação
                      </Button>
                    </Stack>
                  </Stack>
                </Grid>

                {/* Hero Image */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ position: "relative" }}>
                  <Box
                    component={m.div}
                    initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    sx={{
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "140%",
                        height: "140%",
                        background: (theme) =>
                          `radial-gradient(circle, ${theme.palette.primary.main}40 0%, transparent 60%)`,
                        zIndex: 0,
                        filter: "blur(40px)",
                      },
                    }}
                  >
                    <Paper
                      elevation={24}
                      sx={{
                        borderRadius: 4,
                        overflow: "hidden",
                        position: "relative",
                        zIndex: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        transform:
                          "perspective(1000px) rotateY(-5deg) rotateX(2deg)",
                        transition: "transform 0.5s ease",
                        "&:hover": {
                          transform:
                            "perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02)",
                        },
                      }}
                    >
                      <Image
                        src="/images/hero-devices.png"
                        alt="Plataforma Gastometria em Desktop, Tablet e Mobile"
                        width={1200}
                        height={800}
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                        }}
                        priority
                      />
                    </Paper>

                    {/* Floating Elements for "Pop" */}
                    <Card
                      component={m.div}
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      sx={{
                        position: "absolute",
                        top: "10%",
                        right: "-5%",
                        p: 2,
                        borderRadius: 3,
                        boxShadow: 8,
                        display: { xs: "none", lg: "block" },
                        backdropFilter: "blur(8px)",
                        bgcolor: "rgba(30, 30, 30, 0.8)",
                        zIndex: 2,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            p: 1,
                            bgcolor: "success.dark",
                            borderRadius: "50%",
                          }}
                        >
                          <TrendingUp size={20} color="white" />
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block" }}
                          >
                            Economia
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color="success.main"
                          >
                            +15% este mês
                          </Typography>
                        </Box>
                      </Stack>
                    </Card>

                    <Card
                      component={m.div}
                      animate={{ y: [0, 10, 0] }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                      }}
                      sx={{
                        position: "absolute",
                        bottom: "15%",
                        left: "-5%",
                        p: 2,
                        borderRadius: 3,
                        boxShadow: 8,
                        display: { xs: "none", lg: "block" },
                        backdropFilter: "blur(8px)",
                        bgcolor: "rgba(30, 30, 30, 0.8)",
                        zIndex: 2,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            p: 1,
                            bgcolor: "primary.dark",
                            borderRadius: "50%",
                          }}
                        >
                          <Bot size={20} color="white" />
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block" }}
                          >
                            Gastometria AI
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            "Gasto com Uber alto!"
                          </Typography>
                        </Box>
                      </Stack>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* Why Section */}
          <Box
            sx={{ py: { xs: 8, sm: 12, md: 16 }, bgcolor: "background.paper" }}
          >
            <Container maxWidth="xl">
              <Box
                component={m.div}
                {...fadeIn}
                sx={{ textAlign: "center", mb: { xs: 6, sm: 8 } }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: "1.875rem", sm: "2.25rem", md: "3rem" },
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Por que Gastometria?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    maxWidth: "48rem",
                    mx: "auto",
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                  }}
                >
                  Não se trata apenas de números e planilhas. Trata-se de trocar
                  a ansiedade pela confiança. De saber exatamente para onde seu
                  dinheiro vai, você ganha o poder de direcioná-lo para o que
                  realmente importa: suas metas, seus sonhos e sua
                  tranquilidade. O Gastometria foi criado para ser essa chave.
                </Typography>
              </Box>

              <Grid container spacing={4}>
                {features.map((feature, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Box
                      component={m.div}
                      {...fadeIn}
                      transition={{ ...fadeIn.transition, delay: index * 0.1 }}
                    >
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-8px)",
                            boxShadow: 12,
                            outline: "2px solid",
                            outlineColor: "primary.main",
                            outlineOffset: "-2px",
                          },
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ mb: 2, color: feature.color }}>
                            <feature.icon size={40} />
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
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
          <Container maxWidth="xl" sx={{ py: { xs: 8, sm: 12, md: 16 } }}>
            <Box
              component={m.div}
              {...fadeIn}
              sx={{ textAlign: "center", mb: { xs: 6, sm: 8 } }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "1.875rem", sm: "2.25rem", md: "3rem" },
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Planos e Preços
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  maxWidth: "48rem",
                  mx: "auto",
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                }}
              >
                Escolha o plano ideal para suas necessidades. Comece grátis e
                faça upgrade quando quiser.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {plans.map((plan, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
                  <Box
                    component={m.div}
                    {...fadeIn}
                    transition={{ ...fadeIn.transition, delay: index * 0.1 }}
                    sx={{ height: "100%" }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        border: 2,
                        borderColor: plan.popular ? "primary.main" : "divider",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "primary.main",
                          transform: "scale(1.02)",
                          boxShadow: 12,
                        },
                      }}
                    >
                      {plan.popular && (
                        <Box sx={{ position: "absolute", top: 16, right: 16 }}>
                          <Chip
                            label="Mais Popular"
                            color="primary"
                            size="small"
                            icon={<Sparkles size={16} />}
                          />
                        </Box>
                      )}

                      <CardHeader
                        title={plan.name}
                        subheader={plan.description}
                        titleTypographyProps={{
                          variant: "h5",
                          fontWeight: 700,
                        }}
                        subheaderTypographyProps={{ variant: "body2" }}
                      />

                      <CardContent
                        sx={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="h3"
                            component="span"
                            sx={{ fontWeight: 700 }}
                          >
                            {plan.price}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ color: "text.secondary" }}
                          >
                            {plan.period}
                          </Typography>
                        </Box>

                        <Chip
                          label={plan.credits}
                          size="small"
                          sx={{ mb: 3, width: "fit-content" }}
                          color={
                            plan.name === "Básico" ? "default" : "secondary"
                          }
                        />

                        <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                          {plan.features.map((feature, idx) => (
                            <Stack direction="row" spacing={1} key={idx}>
                              <Check
                                size={20}
                                style={{
                                  flexShrink: 0,
                                  marginTop: 2,
                                  color: "#4caf50",
                                }}
                              />
                              <Typography variant="body2">{feature}</Typography>
                            </Stack>
                          ))}
                        </Stack>

                        <Button
                          variant={plan.variant as any}
                          size="large"
                          component={Link}
                          href="/login"
                          fullWidth
                          sx={{
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: 4,
                            },
                          }}
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
          <Box
            sx={{ py: { xs: 8, sm: 12, md: 16 }, bgcolor: "background.paper" }}
          >
            <Container maxWidth="xl">
              <Box
                component={m.div}
                {...fadeIn}
                sx={{ textAlign: "center", mb: { xs: 6, sm: 8 } }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: "1.875rem", sm: "2.25rem", md: "3rem" },
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Comparação Completa de Recursos
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    maxWidth: "48rem",
                    mx: "auto",
                  }}
                >
                  Veja todos os recursos disponíveis em cada plano
                </Typography>
              </Box>

              <TableContainer
                component={Paper}
                sx={{
                  overflow: "auto",
                  "&::-webkit-scrollbar": {
                    height: 8,
                  },
                  "&::-webkit-scrollbar-track": {
                    bgcolor: "background.default",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: "primary.main",
                    borderRadius: 1,
                  },
                }}
              >
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.900" }}>
                      <TableCell
                        sx={{
                          color: "#ffffff",
                          fontWeight: 700,
                          borderBottom: "2px solid",
                          borderColor: "primary.main",
                        }}
                      >
                        Recurso
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: "#ffffff",
                          fontWeight: 700,
                          borderBottom: "2px solid",
                          borderColor: "primary.main",
                        }}
                      >
                        Básico
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: "#ffffff",
                          fontWeight: 700,
                          borderBottom: "2px solid",
                          borderColor: "primary.main",
                        }}
                      >
                        Pro
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: "#ffffff",
                          fontWeight: 700,
                          borderBottom: "2px solid",
                          borderColor: "primary.main",
                        }}
                      >
                        Plus
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: "primary.main",
                          fontWeight: 700,
                          borderBottom: "2px solid",
                          borderColor: "primary.main",
                        }}
                      >
                        Infinity
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonFeatures.map((category, catIndex) => (
                      <React.Fragment key={catIndex}>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell
                            colSpan={5}
                            sx={{ fontWeight: 700, fontSize: "1rem", py: 2 }}
                          >
                            {category.category}
                          </TableCell>
                        </TableRow>
                        {category.features.map((feature, featIndex) => (
                          <TableRow
                            key={featIndex}
                            sx={{
                              "&:nth-of-type(even)": {
                                bgcolor: "action.hover",
                              },
                              "&:hover": { bgcolor: "action.selected" },
                              transition: "background-color 0.2s ease",
                            }}
                          >
                            <TableCell>{feature.name}</TableCell>
                            <TableCell align="center">
                              {renderCellValue(feature.basico)}
                            </TableCell>
                            <TableCell align="center">
                              {renderCellValue(feature.pro)}
                            </TableCell>
                            <TableCell align="center">
                              {renderCellValue(feature.plus)}
                            </TableCell>
                            <TableCell align="center">
                              {renderCellValue(feature.infinity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Container>
          </Box>

          {/* FAQ Section */}
          <Container maxWidth="xl" sx={{ py: { xs: 8, sm: 12, md: 16 } }}>
            <Box
              component={m.div}
              {...fadeIn}
              sx={{ textAlign: "center", mb: { xs: 6, sm: 8 } }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "1.875rem", sm: "2.25rem", md: "3rem" },
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Perguntas Frequentes
              </Typography>
            </Box>

            <Stack spacing={3} sx={{ maxWidth: "48rem", mx: "auto" }}>
              {faqs.map((faq, index) => (
                <Box
                  component={m.div}
                  {...fadeIn}
                  transition={{ ...fadeIn.transition, delay: index * 0.1 }}
                  key={index}
                >
                  <Card
                    sx={{
                      transition: "all 0.3s ease",
                      "&:hover": {
                        bgcolor: "action.hover",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="flex-start"
                      >
                        <HelpCircle
                          size={24}
                          style={{
                            flexShrink: 0,
                            marginTop: 2,
                            color: "#2196f3",
                          }}
                        />
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {faq.question}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
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
              component={m.div}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.6 }}
              sx={{ textAlign: "center", mt: 6 }}
            >
              <Button
                variant="outlined"
                size="large"
                component={Link}
                href="/faq"
                endIcon={<ChevronRight />}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                  },
                }}
              >
                Ver Todas as Perguntas
              </Button>
            </Box>
          </Container>

          {/* Blog Preview Section */}
          <Box
            sx={{ py: { xs: 8, sm: 12, md: 16 }, bgcolor: "background.paper" }}
          >
            <Container maxWidth="xl">
              <Box
                component={m.div}
                {...fadeIn}
                sx={{ textAlign: "center", mb: { xs: 6, sm: 8 } }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: "1.875rem", sm: "2.25rem", md: "3rem" },
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Aprenda Mais
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    maxWidth: "48rem",
                    mx: "auto",
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                  }}
                >
                  Dicas, guias e insights para melhorar sua saúde financeira.
                </Typography>
              </Box>

              <Grid container spacing={4}>
                {blogPosts.map((post, index) => (
                  <Grid size={{ xs: 12, md: 4 }} key={index}>
                    <Box
                      component={m.div}
                      {...fadeIn}
                      transition={{ ...fadeIn.transition, delay: index * 0.1 }}
                      sx={{ height: "100%" }}
                    >
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-8px)",
                            boxShadow: 8,
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                          }}
                        >
                          <Chip
                            label={post.category}
                            size="small"
                            sx={{
                              mb: 2,
                              bgcolor: post.color,
                              color: "white",
                              width: "fit-content",
                            }}
                          />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              mb: 1,
                              minHeight: { md: "3.5rem" },
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {post.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 2,
                              flexGrow: 1,
                              minHeight: { md: "3rem" },
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {post.description}
                          </Typography>
                          <Button
                            variant="text"
                            size="small"
                            component={Link}
                            href={`/blog/${post.slug}`}
                            endIcon={<ArrowRight size={16} />}
                            sx={{
                              p: 0,
                              alignSelf: "flex-start",
                              mt: "auto",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateX(4px)",
                              },
                            }}
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
                component={m.div}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: 0.6 }}
                sx={{ textAlign: "center", mt: 6 }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  href="/blog"
                  endIcon={<ChevronRight />}
                  sx={{
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 4,
                    },
                  }}
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
            py: 4,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Container maxWidth="xl">
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                © {new Date().getFullYear()} Gastometria. Todos os direitos
                reservados.
              </Typography>
              <Stack direction="row" spacing={3}>
                <Link href="/privacy" passHref>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      cursor: "pointer",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    Política de Privacidade
                  </Typography>
                </Link>
                <Link href="/terms" passHref>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      cursor: "pointer",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    Termos de Uso
                  </Typography>
                </Link>
                <Link href="/api-docs" passHref>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      cursor: "pointer",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    API Docs (Infinity)
                  </Typography>
                </Link>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>
    </LazyMotion>
  );
}
