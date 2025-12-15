// src/app/(docs)/docs/[[...slug]]/page.tsx

import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import { DocSidebarNav } from "@/app/(docs)/docs/_components/docs-sidebar-nav";
import { ScrollArea } from "@/components/mui-wrappers/scroll-area";
import { Metadata } from "next";
import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import DocsContent from "./DocsContent";

const docsDirectory = path.join(process.cwd(), "docs");

async function getDocContent(slug: string) {
  const fullPath = path.join(docsDirectory, `${slug}.md`);
  try {
    const fileContents = await fs.readFile(fullPath, "utf8");
    const { content, data } = matter(fileContents);
    return { content, title: data.title };
  } catch (error) {
    // Return fallback content if file doesn't exist
    return getFallbackDocContent(slug);
  }
}

// Fallback content for embedded docs when files don't exist
function getFallbackDocContent(slug: string): { content: string; title: string } | null {
  const embeddedDocs: Record<string, { title: string; content: string }> = {
    introducao: {
      title: "Introdução",
      content: `# Introdução ao Gastometria

Bem-vindo ao Gastometria! Este guia irá ajudá-lo a começar a usar nosso dashboard financeiro inteligente.

## O que é o Gastometria?

O Gastometria é uma plataforma de controle financeiro pessoal que utiliza inteligência artificial para ajudar você a:

- **Registrar transações** manualmente ou via OCR/importação
- **Categorizar gastos** automaticamente com IA
- **Criar orçamentos** e acompanhar metas
- **Gerar relatórios** inteligentes
- **Visualizar tendências** de gastos

## Primeiros Passos

1. Crie sua conta em [/signup](/signup)
2. Adicione sua primeira carteira
3. Comece a registrar transações
4. Configure orçamentos mensais
5. Defina metas financeiras

## Recursos Principais

- **Dashboard**: Visão geral das suas finanças
- **Transações**: Registro e categorização de gastos
- **Carteiras**: Organize contas e cartões
- **Orçamentos**: Limite gastos por categoria
- **Metas**: Alcance objetivos financeiros
- **Relatórios**: Análises com IA

Navegue pelo menu lateral para explorar cada funcionalidade em detalhes.`,
    },
    transacoes: {
      title: "Transações",
      content: `# Transações

Aprenda a gerenciar suas transações no Gastometria.

## Adicionar Transação

Você pode adicionar transações de várias formas:

- **Manual**: Clique em "+ Nova Transação"
- **OCR**: Fotografe notas fiscais (planos Plus+)
- **Importação**: Importe CSV/OFX

## Campos da Transação

- **Valor**: Quantia gasta ou recebida
- **Descrição**: Nome do estabelecimento ou descrição
- **Categoria**: Classificação do gasto
- **Data**: Quando ocorreu
- **Carteira**: De onde saiu/entrou

## Categorização Automática

A IA do Gastometria sugere categorias automaticamente baseado no histórico e descrição da transação.`,
    },
    carteiras: {
      title: "Carteiras",
      content: `# Carteiras

Organize suas finanças com múltiplas carteiras.

## O que são Carteiras?

Carteiras representam suas contas, cartões ou reservas de dinheiro:

- Conta corrente
- Conta poupança
- Cartão de crédito
- Dinheiro físico
- Investimentos

## Criar Carteira

1. Vá em Configurações > Carteiras
2. Clique em "Nova Carteira"
3. Defina nome, tipo e saldo inicial
4. Escolha uma cor e ícone

## Transferências

Mova dinheiro entre carteiras registrando transferências.`,
    },
    orcamentos: {
      title: "Orçamentos",
      content: `# Orçamentos

Controle seus gastos com orçamentos inteligentes.

## Criar Orçamento

1. Acesse a seção Orçamentos
2. Clique em "Novo Orçamento"
3. Escolha a categoria
4. Defina o limite mensal

## Acompanhamento

- Veja quanto já gastou vs limite
- Receba alertas ao se aproximar do limite
- Análise de tendências mensais`,
    },
    metas: {
      title: "Metas",
      content: `# Metas Financeiras

Defina e alcance seus objetivos.

## Criar Meta

1. Vá em Metas
2. Clique em "Nova Meta"
3. Defina:
   - Nome (ex: "Viagem")
   - Valor alvo
   - Prazo
   - Depósito mensal sugerido

## Acompanhamento

O Gastometria mostra seu progresso e dá dicas para alcançar suas metas.`,
    },
    relatorios: {
      title: "Relatórios",
      content: `# Relatórios

Gere análises automáticas com IA.

## Tipos de Relatórios

- **Mensal**: Resumo do mês
- **Por Categoria**: Análise de gastos
- **Comparativo**: Mês a mês
- **Personalizado**: Pergunte à IA

## Geração com IA

1. Clique em "Novo Relatório"
2. Escolha o período
3. A IA gera insights automáticos`,
    },
    importacao: {
      title: "Importação",
      content: `# Importação de Dados

Importe extratos bancários automaticamente.

## Formatos Suportados

- **CSV**: Planilhas de banco
- **OFX/QFX**: Formato bancário padrão

## Como Importar

1. Exporte o extrato do seu banco
2. Vá em Transações > Importar
3. Selecione o arquivo
4. Mapeie as colunas
5. Confirme a importação

As transações serão categorizadas automaticamente.`,
    },
    "configuracao-ia": {
      title: "Configuração IA",
      content: `# Configuração de IA

Configure seu provedor de IA preferido.

## Provedores Disponíveis

- **OpenAI** (GPT-4, GPT-3.5)
- **Google AI** (Gemini)
- **Ollama** (Local, gratuito)

## Configurar OpenAI

1. Vá em Configurações > IA
2. Cole sua API Key
3. Escolha o modelo

## Usar Ollama (Gratuito)

Com Ollama você pode usar IA localmente sem custos:

1. Instale o Ollama
2. Baixe um modelo (llama2, mistral)
3. Configure a URL no Gastometria`,
    },
  };

  return embeddedDocs[slug] || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.join("/") || "introducao";
  const doc = await getDocContent(slug);

  if (!doc) {
    return {
      title: "Página não encontrada | Gastometria Docs",
    };
  }

  const descriptions: Record<string, string> = {
    introducao:
      "Guia completo para começar a usar o Gastometria. Aprenda os conceitos básicos do dashboard financeiro inteligente.",
    transacoes:
      "Como adicionar, editar e gerenciar suas transações no Gastometria. Guia completo de controle de gastos.",
    carteiras:
      "Aprenda a criar e gerenciar carteiras no Gastometria. Organize suas contas e cartões de crédito.",
    orcamentos:
      "Como criar e monitorar orçamentos inteligentes no Gastometria. Controle seus gastos por categoria.",
    metas:
      "Defina e acompanhe suas metas financeiras no Gastometria. Planeje sua independência financeira.",
    relatorios:
      "Gere relatórios automáticos com IA no Gastometria. Análises detalhadas de seus gastos e tendências.",
    importacao:
      "Como importar extratos bancários (CSV/OFX) no Gastometria. Automatize o registro de transações.",
    "configuracao-ia":
      "Configure provedores de IA no Gastometria. Use OpenAI, Google AI ou Ollama local.",
  };

  return {
    title: `${doc.title} | Gastometria Docs`,
    description:
      descriptions[slug] || `Documentação do Gastometria: ${doc.title}`,
    openGraph: {
      title: `${doc.title} | Gastometria Docs`,
      description:
        descriptions[slug] || `Aprenda sobre ${doc.title} no Gastometria`,
      url: `https://gastometria.com.br/docs/${slug}`,
    },
  };
}

async function getDocs() {
  try {
    // Check if directory exists first
    try {
      await fs.access(docsDirectory);
    } catch {
      // Directory doesn't exist, return fallback docs
      return getFallbackDocs();
    }

    const files = await fs.readdir(docsDirectory, { withFileTypes: true });
    // Filter only .md files (exclude directories)
    const mdFiles = files.filter(
      (file) => file.isFile() && file.name.endsWith(".md")
    );

    if (mdFiles.length === 0) {
      return getFallbackDocs();
    }

    const docs = await Promise.all(
      mdFiles.map(async (file) => {
        const slug = file.name.replace(/\.md$/, "");
        const fullPath = path.join(docsDirectory, file.name);
        const fileContents = await fs.readFile(fullPath, "utf8");
        const { data } = matter(fileContents);
        return {
          title: data.title || slug.replace(/-/g, " "),
          slug: slug,
          order: data.order || 99,
        };
      })
    );
    return docs.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Could not read docs directory:", error);
    return getFallbackDocs();
  }
}

// Fallback docs when directory doesn't exist (production without docs folder)
function getFallbackDocs() {
  return [
    { title: "Introdução", slug: "introducao", order: 1 },
    { title: "Transações", slug: "transacoes", order: 2 },
    { title: "Carteiras", slug: "carteiras", order: 3 },
    { title: "Orçamentos", slug: "orcamentos", order: 4 },
    { title: "Metas", slug: "metas", order: 5 },
    { title: "Relatórios", slug: "relatorios", order: 6 },
    { title: "Importação", slug: "importacao", order: 7 },
    { title: "Configuração IA", slug: "configuracao-ia", order: 8 },
  ];
}

const markdownStyles = {
  "& h1": {
    fontSize: { xs: "2rem", md: "2.5rem" },
    fontWeight: 700,
    mb: 4,
    mt: 2,
    letterSpacing: "-0.02em",
  },
  "& h2": {
    fontSize: { xs: "1.5rem", md: "1.75rem" },
    fontWeight: 600,
    mb: 2,
    mt: 4,
    borderBottom: 1,
    borderColor: "divider",
    pb: 1,
  },
  "& h3": {
    fontSize: { xs: "1.25rem", md: "1.5rem" },
    fontWeight: 600,
    mb: 2,
    mt: 3,
  },
  "& p": {
    fontSize: "1rem",
    lineHeight: 1.7,
    mb: 2,
    color: "text.secondary",
  },
  "& ul, & ol": {
    pl: 4,
    mb: 2,
  },
  "& li": {
    mb: 1,
    color: "text.secondary",
  },
  "& a": {
    color: "primary.main",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  "& code": {
    bgcolor: "action.hover",
    color: "text.primary",
    px: 0.5,
    py: 0.25,
    borderRadius: 1,
    fontFamily: "monospace",
    fontSize: "0.875em",
  },
  "& pre": {
    bgcolor: "grey.900",
    color: "grey.100",
    p: 2,
    borderRadius: 2,
    overflow: "auto",
    mb: 3,
    "& code": {
      bgcolor: "transparent",
      color: "inherit",
      p: 0,
    },
  },
  "& blockquote": {
    borderLeft: 4,
    borderColor: "primary.main",
    pl: 2,
    ml: 0,
    my: 2,
    fontStyle: "italic",
    color: "text.secondary",
  },
  "& img": {
    maxWidth: "100%",
    height: "auto",
    borderRadius: 2,
    my: 2,
  },
};

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.join("/") || "introducao";
  const doc = await getDocContent(slug);
  const allDocs = await getDocs();

  if (!doc) {
    notFound();
  }

  // Render client component that uses MUI components
  return <DocsContent doc={doc!} allDocs={allDocs} />;
}
export async function generateStaticParams() {
  const docs = await getDocs();
  return docs.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}
