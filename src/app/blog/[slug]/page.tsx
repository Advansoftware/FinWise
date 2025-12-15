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
import { use } from "react";


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

## Conclusão

Controlar gastos é um hábito que se desenvolve com o tempo. Comece implementando uma dica por vez e seja paciente consigo mesmo.

O **Gastometria** pode ser seu aliado nessa jornada, oferecendo ferramentas inteligentes para tornar o controle financeiro mais simples e eficaz.
    `,
    category: "Educação Financeira",
    readTime: 8,
    publishedAt: "2025-01-15",
    author: "Equipe Gastometria",
  },
  "como-economizar-1000-por-mes": {
    title: "Como Economizar R$ 1000 por Mês",
    description:
      "Descubra estratégias práticas para reduzir gastos e aumentar sua poupança mensal.",
    content: `
# Como Economizar R$ 1000 por Mês

Economizar R$ 1000 por mês pode parecer desafiador, mas com as estratégias certas, é totalmente possível. Vamos explorar métodos práticos para alcançar essa meta.

## Analise Seus Gastos Atuais

O primeiro passo é entender para onde vai o seu dinheiro. Use o **Gastometria** para categorizar automaticamente todas as suas transações e identificar onde estão os maiores gastos.

## Corte Gastos Desnecessários

- **Assinaturas não utilizadas**: Revise streamings, academias e serviços mensais
- **Alimentação fora**: Reduza refeições em restaurantes
- **Compras por impulso**: Espere 48h antes de comprar algo não essencial

## Otimize Contas Fixas

- Negocie planos de internet e celular
- Compare preços de seguros anualmente
- Considere trocar de banco para contas sem taxas

## Aumente Sua Renda

- Venda itens que não usa mais
- Considere trabalhos freelance
- Monetize hobbies e habilidades

## Conclusão

Com disciplina e as ferramentas certas, economizar R$ 1000 por mês é uma meta alcançável. O **Gastometria** pode ajudar você a monitorar seu progresso e celebrar suas conquistas.
    `,
    category: "Economia",
    readTime: 6,
    publishedAt: "2025-01-12",
    author: "Equipe Gastometria",
  },
  "guia-investimentos-iniciantes": {
    title: "Guia Completo de Investimentos para Iniciantes",
    description:
      "Tudo que você precisa saber para começar a investir com segurança.",
    content: `
# Guia Completo de Investimentos para Iniciantes

Começar a investir pode parecer intimidador, mas é mais simples do que você imagina. Este guia vai te ajudar a dar os primeiros passos.

## Por Que Investir?

O dinheiro parado perde valor com a inflação. Investir é a forma de fazer seu dinheiro trabalhar para você.

## Primeiros Passos

### 1. Monte Sua Reserva de Emergência
Antes de investir, tenha 6 meses de gastos guardados em investimentos de alta liquidez.

### 2. Defina Seus Objetivos
- Curto prazo (até 2 anos): viagens, compras
- Médio prazo (2-5 anos): carro, entrada de imóvel
- Longo prazo (5+ anos): aposentadoria, patrimônio

### 3. Conheça Seu Perfil de Investidor
- **Conservador**: Prioriza segurança
- **Moderado**: Equilibra risco e retorno
- **Arrojado**: Aceita mais risco por mais retorno

## Opções para Iniciantes

- **Tesouro Direto**: Títulos do governo, baixo risco
- **CDBs**: Certificados de Depósito Bancário
- **Fundos de Investimento**: Gestão profissional
- **Ações**: Para longo prazo e diversificação

## Conclusão

Comece pequeno, estude constantemente e diversifique. Use o **Gastometria** para acompanhar seus investimentos junto com suas finanças do dia a dia.
    `,
    category: "Investimentos",
    readTime: 10,
    publishedAt: "2025-01-10",
    author: "Equipe Gastometria",
  },
  "planejamento-financeiro-familiar": {
    title: "Planejamento Financeiro Familiar",
    description:
      "Organize as finanças da família e alcance seus objetivos juntos.",
    content: `
# Planejamento Financeiro Familiar

Gerenciar as finanças de uma família exige organização, comunicação e planejamento. Veja como fazer isso de forma eficiente.

## Envolva Toda a Família

O planejamento financeiro deve ser uma atividade conjunta. Realize reuniões mensais para:
- Revisar gastos
- Ajustar orçamentos
- Definir metas em conjunto

## Crie um Orçamento Familiar

### Gastos Fixos
- Moradia (aluguel/financiamento)
- Contas de consumo
- Escola e transporte

### Gastos Variáveis
- Alimentação
- Lazer
- Vestuário

### Investimentos
- Reserva de emergência
- Planos de previdência
- Educação dos filhos

## Defina Metas em Conjunto

- Viagem em família
- Troca de carro
- Reforma da casa
- Faculdade dos filhos

## Use Ferramentas de Controle

O **Gastometria** permite que toda a família acompanhe os gastos em tempo real, com:
- Múltiplas carteiras por membro
- Relatórios consolidados
- Metas compartilhadas

## Conclusão

Planejamento financeiro familiar fortalece a união e garante um futuro mais seguro para todos. Comece hoje mesmo!
    `,
    category: "Planejamento",
    readTime: 7,
    publishedAt: "2025-01-08",
    author: "Equipe Gastometria",
  },
  "ia-revoluciona-financas": {
    title: "Como a Inteligência Artificial Pode Revolucionar suas Finanças",
    description:
      "Entenda como a IA pode ajudar no controle financeiro, análise de gastos e tomada de decisões inteligentes.",
    content: `
# Como a Inteligência Artificial Pode Revolucionar suas Finanças

A inteligência artificial está transformando a forma como gerenciamos nosso dinheiro. Descubra como essa tecnologia pode ser sua aliada.

## O Que a IA Pode Fazer Por Você

### Categorização Automática
A IA analisa suas transações e categoriza automaticamente:
- Supermercado → Alimentação
- Uber → Transporte
- Netflix → Entretenimento

### Análise de Padrões
Identifica tendências nos seus gastos:
- "Você gasta 30% mais em restaurantes no fim de semana"
- "Seus gastos com delivery aumentaram 15% este mês"

### Previsões Financeiras
Com base no seu histórico, a IA pode:
- Prever seu saldo no final do mês
- Alertar sobre possíveis problemas financeiros
- Sugerir ajustes no orçamento

## Assistentes Virtuais Financeiros

O **Gastometria** oferece um assistente de IA que pode:
- Responder perguntas sobre suas finanças
- Gerar relatórios personalizados
- Dar dicas de economia baseadas no seu perfil

## Segurança e Privacidade

Seus dados são processados com:
- Criptografia de ponta a ponta
- Anonimização de informações sensíveis
- Compliance com LGPD

## Conclusão

A IA não substitui o planejamento, mas potencializa suas decisões. Use ferramentas inteligentes como o **Gastometria** para ter mais controle sobre seu dinheiro.
    `,
    category: "Tecnologia",
    readTime: 12,
    publishedAt: "2025-01-10",
    author: "Equipe Gastometria",
  },
  "orcamento-50-30-20": {
    title: "Orçamento 50/30/20: O Método que Funciona de Verdade",
    description:
      "Aprenda a aplicar a regra 50/30/20 na prática e organize suas finanças de forma simples e eficiente.",
    content: `
# Orçamento 50/30/20: O Método que Funciona de Verdade

A regra 50/30/20 é uma das formas mais simples e eficazes de organizar seu orçamento. Veja como aplicá-la.

## Como Funciona

Divida sua renda líquida em três categorias:

### 50% - Necessidades
Gastos essenciais que você não pode evitar:
- Moradia (aluguel/financiamento)
- Contas básicas (água, luz, gás)
- Alimentação
- Transporte para trabalho
- Saúde básica

### 30% - Desejos
Gastos que melhoram sua qualidade de vida:
- Restaurantes e delivery
- Entretenimento (cinema, streaming)
- Hobbies
- Compras não essenciais
- Viagens

### 20% - Poupança e Investimentos
Construção do seu futuro:
- Reserva de emergência
- Investimentos
- Pagamento extra de dívidas
- Planos de longo prazo

## Como Aplicar na Prática

1. **Calcule sua renda líquida** (após impostos e descontos)
2. **Liste todos os gastos** e categorize-os
3. **Ajuste os valores** para se encaixar nos percentuais
4. **Monitore mensalmente** com o Gastometria

## Exemplo Prático

Renda: R$ 5.000

| Categoria | % | Valor |
|-----------|---|-------|
| Necessidades | 50% | R$ 2.500 |
| Desejos | 30% | R$ 1.500 |
| Poupança | 20% | R$ 1.000 |

## Conclusão

A regra 50/30/20 é flexível e pode ser adaptada à sua realidade. O importante é ter um plano e segui-lo consistentemente.
    `,
    category: "Planejamento",
    readTime: 6,
    publishedAt: "2025-01-05",
    author: "Equipe Gastometria",
  },
  "metas-financeiras-smart": {
    title: "Metas Financeiras SMART: Como Definir e Alcançar seus Objetivos",
    description:
      "Use a metodologia SMART para criar metas financeiras realistas e atingíveis em 2025.",
    content: `
# Metas Financeiras SMART

A metodologia SMART ajuda você a criar metas claras e alcançáveis. Aprenda a aplicá-la nas suas finanças.

## O Que São Metas SMART?

Cada letra representa um critério:

### S - Específica (Specific)
Em vez de "quero economizar dinheiro", defina "quero economizar R$ 12.000 para uma viagem".

### M - Mensurável (Measurable)
Sua meta deve ter números que você possa acompanhar:
- Economizar R$ 1.000 por mês
- Reduzir gastos com delivery em 50%

### A - Atingível (Achievable)
Seja realista com sua capacidade:
- Considere sua renda atual
- Avalie seus compromissos fixos

### R - Relevante (Relevant)
A meta deve fazer sentido para você:
- Alinha-se com seus valores?
- Vai melhorar sua vida?

### T - Temporal (Time-bound)
Defina um prazo:
- "Até dezembro de 2025"
- "Em 6 meses"

## Exemplos de Metas SMART

❌ **Ruim**: "Quero juntar dinheiro"
✅ **SMART**: "Vou economizar R$ 500 por mês durante 12 meses para montar minha reserva de emergência de R$ 6.000 até dezembro de 2025"

## Como o Gastometria Ajuda

- Crie metas com valores e prazos
- Acompanhe o progresso visualmente
- Receba alertas e dicas da IA
- Celebre quando atingir objetivos

## Conclusão

Metas SMART transformam sonhos vagos em planos concretos. Comece definindo uma meta hoje!
    `,
    category: "Planejamento",
    readTime: 10,
    publishedAt: "2024-12-28",
    author: "Equipe Gastometria",
  },
  "ocr-notas-fiscais": {
    title: "OCR para Notas Fiscais: Como Digitalizar suas Despesas Automaticamente",
    description:
      "Descubra como usar tecnologia OCR para registrar suas compras automaticamente e economizar tempo.",
    content: `
# OCR para Notas Fiscais: Digitalize Suas Despesas

A tecnologia OCR (Optical Character Recognition) transforma fotos de notas fiscais em dados estruturados automaticamente.

## O Que é OCR?

OCR é uma tecnologia que:
- Lê texto em imagens
- Extrai informações relevantes
- Organiza os dados automaticamente

## Como Funciona no Gastometria

1. **Tire uma foto** da nota fiscal
2. **A IA processa** a imagem
3. **Os dados são extraídos**:
   - Estabelecimento
   - Valor total
   - Data da compra
   - Itens (quando disponível)
4. **A transação é criada** automaticamente

## Benefícios

### Economia de Tempo
Não precisa digitar manualmente cada compra.

### Precisão
Menos erros de digitação.

### Organização
Todas as compras categorizadas corretamente.

### Histórico
Guarde as notas digitalmente.

## Dicas Para Melhores Resultados

- Fotografe em ambiente bem iluminado
- Mantenha a nota esticada
- Inclua toda a nota no enquadramento
- Evite reflexos e sombras

## Tipos de Documentos Suportados

- Cupons fiscais (NFCe)
- Notas fiscais eletrônicas
- Recibos de pagamento
- Comprovantes de cartão

## Conclusão

O OCR elimina o trabalho manual de registrar compras. No **Gastometria**, essa funcionalidade está disponível nos planos Plus e Infinity.
    `,
    category: "Tecnologia",
    readTime: 7,
    publishedAt: "2024-12-20",
    author: "Equipe Gastometria",
  },
  "investimentos-iniciantes-2025": {
    title: "Investimentos para Iniciantes: Por Onde Começar em 2025",
    description:
      "Guia completo para quem quer começar a investir, com dicas práticas e estratégias seguras.",
    content: `
# Investimentos para Iniciantes: Por Onde Começar em 2025

2025 é o ano perfeito para começar a investir. Veja por onde começar.

## Antes de Investir

### 1. Quite Dívidas de Juros Altos
Cartão de crédito e cheque especial são prioridade.

### 2. Monte Sua Reserva de Emergência
6 meses de gastos em investimentos de liquidez diária.

### 3. Entenda Seu Perfil
- **Conservador**: Prefere segurança
- **Moderado**: Aceita algum risco
- **Arrojado**: Busca maiores retornos

## Opções Para Iniciantes

### Tesouro Direto
- Baixo risco
- Garantia do governo
- Variedade de títulos
- A partir de R$ 30

### CDBs
- Protegido pelo FGC (até R$ 250k)
- Rentabilidade acima da poupança
- Diversas opções de prazo

### Fundos de Investimento
- Gestão profissional
- Diversificação
- Diversos tipos e estratégias

### Ações (Long Term)
- Maior potencial de retorno
- Maior volatilidade
- Ideal para longo prazo

## Erros Comuns Para Evitar

1. Investir sem reserva de emergência
2. Colocar tudo em um só ativo
3. Vender no pânico
4. Não considerar impostos

## Como o Gastometria Ajuda

Acompanhe seus investimentos junto com suas finanças do dia a dia:
- Visão consolidada do patrimônio
- Metas de investimento
- Relatórios de progresso

## Conclusão

Comece pequeno, seja consistente e tenha paciência. O tempo é seu maior aliado nos investimentos.
    `,
    category: "Investimentos",
    readTime: 15,
    publishedAt: "2024-12-15",
    author: "Equipe Gastometria",
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default function BlogPostPage({ params }: Props) {
  const { slug } = use(params);
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString + 'T12:00:00Z');
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} de ${month} de ${year}`;
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
