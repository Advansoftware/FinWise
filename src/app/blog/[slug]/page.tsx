"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Share2 } from "lucide-react";
import {
  Button,
  Chip,
  Divider,
  Box,
  Typography,
  Stack,
  Container,
  Card,
  CardContent,
} from "@mui/material";

// Mock data - em produção isso viria do CMS
const blogPosts: Record<string, any> = {
  "controlar-gastos-2025": {
    title: "10 Dicas Essenciais para Controlar seus Gastos em 2025",
    description:
      "Descubra estratégias práticas e eficazes para manter suas finanças organizadas e alcançar seus objetivos financeiros.",
    content: `
# 10 Dicas Essenciais para Controlar seus Gastos em 2025

Controlar os gastos é fundamental para ter uma vida financeira saudável. Com o início de 2025, é o momento perfeito para implementar estratégias que vão transformar sua relação com o dinheiro.

## 1. Conheça Exatamente Onde Seu Dinheiro Vai

O primeiro passo para controlar os gastos é saber exatamente onde seu dinheiro está sendo gasto. Use ferramentas como o **Gastometria** para registrar todas as suas transações automaticamente.

### Dica Prática:
- Categorize todos os gastos
- Revise semanalmente suas despesas
- Identifique padrões de consumo

## 2. Defina um Orçamento Realista

Criar um orçamento não significa se privar de tudo, mas sim ter consciência de seus limites financeiros.

### A Regra 50/30/20:
- **50%** para necessidades básicas
- **30%** para desejos e lazer  
- **20%** para poupança e investimentos

## 3. Use a Tecnologia a Seu Favor

Aplicativos com inteligência artificial podem:
- Categorizar gastos automaticamente
- Alertar sobre gastos excessivos
- Sugerir otimizações no orçamento
- Prever gastos futuros

## 4. Elimine Gastos Supérfluos

Revise suas assinaturas e serviços:
- Streamings que não usa
- Academias frequentadas esporadicamente
- Assinaturas de revistas esquecidas

## 5. Compre com Lista e Propósito

Sempre faça uma lista antes de ir às compras e mantenha-se fiel a ela. Isso evita compras por impulso.

## 6. Negocie Suas Contas Fixas

Renegocie anualmente:
- Plano de celular
- Internet
- Seguros
- Financiamentos

## 7. Crie uma Reserva de Emergência

Tenha pelo menos 6 meses de gastos guardados para imprevistos.

## 8. Automatize Suas Economias

Configure transferências automáticas para sua poupança logo após receber o salário.

## 9. Monitore e Ajuste Regularmente

Faça revisões mensais do seu orçamento e ajuste conforme necessário.

## 10. Celebrate Suas Conquistas

Reconheça quando alcançar suas metas financeiras. Isso mantém a motivação.

## Conclusão

Controlar gastos é um hábito que se desenvolve com o tempo. Comece implementando uma dica por vez e seja paciente consigo mesmo.

O **Gastometria** pode ser seu aliado nessa jornada, oferecendo ferramentas inteligentes para tornar o controle financeiro mais simples e eficaz.
    `,
    category: "Educação Financeira",
    readTime: 8,
    publishedAt: "2025-01-15",
    author: "Equipe Gastometria",
  },
};

type Props = {
  params: { slug: string };
};

export default function BlogPostPage({ params }: Props) {
  const post = blogPosts[params.slug];

  if (!post) {
    notFound();
  }

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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          component={Link}
          href="/blog"
          variant="text"
          sx={{ mb: 3 }}
          startIcon={
            <Box component={ArrowLeft} sx={{ height: 16, width: 16 }} />
          }
        >
          Voltar ao Blog
        </Button>

        <Box component="article" sx={{ maxWidth: "56rem", mx: "auto" }}>
          {/* Header */}
          <Box component="header" sx={{ mb: 4 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Chip
                label={post.category}
                color={getCategoryColor(post.category)}
                size="small"
              />
              <Stack
                direction="row"
                alignItems="center"
                sx={{ fontSize: "0.875rem", color: "text.secondary" }}
              >
                <Box
                  component={Clock}
                  sx={{ height: 16, width: 16, mr: 0.5 }}
                />
                {post.readTime} min de leitura
              </Stack>
            </Stack>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2rem", md: "3rem" },
                fontWeight: "bold",
                letterSpacing: "-0.025em",
                mb: 2,
              }}
            >
              {post.title}
            </Typography>

            <Typography
              variant="body1"
              sx={{ fontSize: "1.25rem", color: "text.secondary", mb: 3 }}
            >
              {post.description}
            </Typography>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ fontSize: "0.875rem", color: "text.secondary" }}
              >
                <Stack direction="row" alignItems="center">
                  <Box
                    component={CalendarDays}
                    sx={{ height: 16, width: 16, mr: 0.5 }}
                  />
                  {formatDate(post.publishedAt)}
                </Stack>
                <Typography component="span">•</Typography>
                <Typography component="span">Por {post.author}</Typography>
              </Stack>

              <Button
                variant="outlined"
                size="small"
                startIcon={
                  <Box component={Share2} sx={{ height: 16, width: 16 }} />
                }
              >
                Compartilhar
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Content */}
          <Box
            sx={{
              "& h1, & h2, & h3": {
                fontWeight: "bold",
                mt: 3,
                mb: 2,
              },
              "& p": {
                mb: 2,
                lineHeight: 1.8,
              },
              "& ul, & ol": {
                pl: 3,
                mb: 2,
              },
              "& li": {
                mb: 1,
              },
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: post.content.replace(/\n/g, "<br>"),
              }}
            />
          </Box>

          <Divider sx={{ my: 6 }} />

          {/* CTA */}
          <Card sx={{ bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Gostou do artigo? Experimente o Gastometria!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Coloque essas dicas em prática com nosso dashboard financeiro
                inteligente. Comece gratuitamente e transforme sua vida
                financeira.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  component={Link}
                  href="/signup"
                  variant="contained"
                  size="large"
                >
                  Criar Conta Grátis
                </Button>
                <Button
                  component={Link}
                  href="/docs"
                  variant="outlined"
                  size="large"
                >
                  Ver Documentação
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
