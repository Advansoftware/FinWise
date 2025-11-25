"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  Box,
  Stack,
  Container,
  TextField,
  Grid,
} from "@mui/material";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "10 Dicas Essenciais para Controlar seus Gastos em 2025",
    description:
      "Descubra estratégias práticas e eficazes para manter suas finanças organizadas e alcançar seus objetivos financeiros.",
    category: "Educação Financeira",
    readTime: 8,
    publishedAt: "2025-01-15",
    slug: "controlar-gastos-2025",
    featured: true,
  },
  {
    id: 2,
    title: "Como a Inteligência Artificial Pode Revolucionar suas Finanças",
    description:
      "Entenda como a IA pode ajudar no controle financeiro, análise de gastos e tomada de decisões inteligentes.",
    category: "Tecnologia",
    readTime: 12,
    publishedAt: "2025-01-10",
    slug: "ia-revoluciona-financas",
    featured: true,
  },
  {
    id: 3,
    title: "Orçamento 50/30/20: O Método que Funciona de Verdade",
    description:
      "Aprenda a aplicar a regra 50/30/20 na prática e organize suas finanças de forma simples e eficiente.",
    category: "Planejamento",
    readTime: 6,
    publishedAt: "2025-01-05",
    slug: "orcamento-50-30-20",
    featured: false,
  },
  {
    id: 4,
    title: "Metas Financeiras SMART: Como Definir e Alcançar seus Objetivos",
    description:
      "Use a metodologia SMART para criar metas financeiras realistas e atingíveis em 2025.",
    category: "Planejamento",
    readTime: 10,
    publishedAt: "2024-12-28",
    slug: "metas-financeiras-smart",
    featured: false,
  },
  {
    id: 5,
    title:
      "OCR para Notas Fiscais: Como Digitalizar suas Despesas Automaticamente",
    description:
      "Descubra como usar tecnologia OCR para registrar suas compras automaticamente e economizar tempo.",
    category: "Tecnologia",
    readTime: 7,
    publishedAt: "2024-12-20",
    slug: "ocr-notas-fiscais",
    featured: false,
  },
  {
    id: 6,
    title: "Investimentos para Iniciantes: Por Onde Começar em 2025",
    description:
      "Guia completo para quem quer começar a investir, com dicas práticas e estratégias seguras.",
    category: "Investimentos",
    readTime: 15,
    publishedAt: "2024-12-15",
    slug: "investimentos-iniciantes-2025",
    featured: false,
  },
];

const categories = [
  "Todos",
  "Educação Financeira",
  "Tecnologia",
  "Planejamento",
  "Investimentos",
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getCategoryColor(
  category: string
): "success" | "info" | "secondary" | "warning" | "default" {
  const colors: Record<
    string,
    "success" | "info" | "secondary" | "warning" | "default"
  > = {
    "Educação Financeira": "success",
    Tecnologia: "info",
    Planejamento: "secondary",
    Investimentos: "warning",
  };
  return colors[category] || "default";
}

export default function BlogPage() {
  const featuredPosts = blogPosts.filter((post) => post.featured);
  const regularPosts = blogPosts.filter((post) => !post.featured);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Box
        sx={{
          background:
            "linear-gradient(to bottom, rgba(var(--primary-rgb), 0.05), transparent)",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box sx={{ maxWidth: "48rem", mx: "auto", textAlign: "center" }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: "bold",
                letterSpacing: "-0.025em",
                mb: 3,
              }}
            >
              Blog Gastometria
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: "1.25rem", color: "text.secondary", mb: 4 }}
            >
              Artigos sobre educação financeira, tecnologia e dicas práticas
              para transformar sua relação com o dinheiro.
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              justifyContent="center"
              useFlexGap
            >
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      borderColor: "primary.main",
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <Box component="section" sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Artigos em Destaque
            </Typography>
            <Grid container spacing={4}>
              {featuredPosts.map((post) => (
                <Grid key={post.id} size={{ xs: 12, md: 6 }}>
                  <Card
                    sx={{
                      overflow: "hidden",
                      transition: "box-shadow 0.2s",
                      "&:hover": { boxShadow: 4 },
                      "& .post-title:hover": { color: "primary.main" },
                    }}
                  >
                    <CardHeader
                      title={
                        <>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                          >
                            <Chip
                              label={post.category}
                              color={getCategoryColor(post.category)}
                              size="small"
                            />
                            <Stack
                              direction="row"
                              alignItems="center"
                              sx={{
                                fontSize: "0.875rem",
                                color: "text.secondary",
                              }}
                            >
                              <Box
                                component={Clock}
                                sx={{ height: 16, width: 16, mr: 0.5 }}
                              />
                              {post.readTime} min
                            </Stack>
                          </Stack>
                          <Typography
                            variant="h6"
                            component={Link}
                            href={`/blog/${post.slug}`}
                            sx={{
                              textDecoration: "none",
                              color: "text.primary",
                              transition: "color 0.2s",
                              "&:hover": { color: "primary.main" },
                            }}
                          >
                            {post.title}
                          </Typography>
                        </>
                      }
                      subheader={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {post.description}
                        </Typography>
                      }
                    />
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                        >
                          <Box
                            component={CalendarDays}
                            sx={{ height: 16, width: 16, mr: 0.5 }}
                          />
                          {formatDate(post.publishedAt)}
                        </Stack>
                        <Button
                          component={Link}
                          href={`/blog/${post.slug}`}
                          variant="text"
                          size="small"
                          endIcon={
                            <Box
                              component={ArrowRight}
                              sx={{ height: 16, width: 16 }}
                            />
                          }
                        >
                          Ler mais
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Regular Posts */}
        <Box component="section">
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
            Todos os Artigos
          </Typography>
          <Grid container spacing={3}>
            {regularPosts.map((post) => (
              <Grid key={post.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card
                  sx={{
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 3 },
                  }}
                >
                  <CardHeader
                    title={
                      <>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          <Chip
                            label={post.category}
                            variant="outlined"
                            color={getCategoryColor(post.category)}
                            size="small"
                          />
                          <Stack
                            direction="row"
                            alignItems="center"
                            sx={{
                              fontSize: "0.875rem",
                              color: "text.secondary",
                            }}
                          >
                            <Box
                              component={Clock}
                              sx={{ height: 16, width: 16, mr: 0.5 }}
                            />
                            {post.readTime} min
                          </Stack>
                        </Stack>
                        <Typography
                          variant="h6"
                          component={Link}
                          href={`/blog/${post.slug}`}
                          sx={{
                            fontSize: "1rem",
                            textDecoration: "none",
                            color: "text.primary",
                            transition: "color 0.2s",
                            "&:hover": { color: "primary.main" },
                          }}
                        >
                          {post.title}
                        </Typography>
                      </>
                    }
                    subheader={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {post.description}
                      </Typography>
                    }
                  />
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                      >
                        <Box
                          component={CalendarDays}
                          sx={{ height: 16, width: 16, mr: 0.5 }}
                        />
                        {formatDate(post.publishedAt)}
                      </Stack>
                      <Button
                        component={Link}
                        href={`/blog/${post.slug}`}
                        variant="text"
                        size="small"
                      >
                        <Box
                          component={ArrowRight}
                          sx={{ height: 16, width: 16 }}
                        />
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Newsletter CTA */}
        <Card sx={{ mt: 8, bgcolor: "background.paper" }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              Receba dicas financeiras direto no seu email
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: "40rem", mx: "auto" }}
            >
              Cadastre-se em nossa newsletter e receba semanalmente artigos
              exclusivos sobre educação financeira, dicas de economia e
              novidades do Gastometria.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ maxWidth: "28rem", mx: "auto" }}
            >
              <TextField
                type="email"
                placeholder="Seu melhor email"
                size="small"
                fullWidth
              />
              <Button variant="contained">Inscrever-se</Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
