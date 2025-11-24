
// src/app/(docs)/docs/[[...slug]]/page.tsx

import {promises as fs} from 'fs';
import path from 'path';
import {notFound} from 'next/navigation';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import {DocSidebarNav} from '@/app/(docs)/docs/_components/docs-sidebar-nav';
import {ScrollArea} from '@/components/mui-wrappers/scroll-area';
import {Metadata} from 'next';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import DocsContent from './DocsContent';

const docsDirectory = path.join(process.cwd(), 'docs');

async function getDocContent(slug: string) {
    const fullPath = path.join(docsDirectory, `${slug}.md`);
    try {
        const fileContents = await fs.readFile(fullPath, 'utf8');
        const { content, data } = matter(fileContents);
        return { content, title: data.title };
    } catch (error) {
        return null;
    }
}

export async function generateMetadata(
  { params }: { params: { slug?: string[] } }
): Promise<Metadata> {
  const slug = params.slug?.join('/') || 'introducao';
  const doc = await getDocContent(slug);
  
  if (!doc) {
    return {
      title: 'Página não encontrada | Gastometria Docs',
    };
  }

  const descriptions: Record<string, string> = {
    introducao: 'Guia completo para começar a usar o Gastometria. Aprenda os conceitos básicos do dashboard financeiro inteligente.',
    transacoes: 'Como adicionar, editar e gerenciar suas transações no Gastometria. Guia completo de controle de gastos.',
    carteiras: 'Aprenda a criar e gerenciar carteiras no Gastometria. Organize suas contas e cartões de crédito.',
    orcamentos: 'Como criar e monitorar orçamentos inteligentes no Gastometria. Controle seus gastos por categoria.',
    metas: 'Defina e acompanhe suas metas financeiras no Gastometria. Planeje sua independência financeira.',
    relatorios: 'Gere relatórios automáticos com IA no Gastometria. Análises detalhadas de seus gastos e tendências.',
    importacao: 'Como importar extratos bancários (CSV/OFX) no Gastometria. Automatize o registro de transações.',
    'configuracao-ia': 'Configure provedores de IA no Gastometria. Use OpenAI, Google AI ou Ollama local.',
  };

  return {
    title: `${doc.title} | Gastometria Docs`,
    description: descriptions[slug] || `Documentação do Gastometria: ${doc.title}`,
    openGraph: {
      title: `${doc.title} | Gastometria Docs`,
      description: descriptions[slug] || `Aprenda sobre ${doc.title} no Gastometria`,
      url: `https://gastometria.com.br/docs/${slug}`,
    },
  };
}

async function getDocs() {
    try {
        const files = await fs.readdir(docsDirectory);
        const docs = await Promise.all(files.map(async (file) => {
            const slug = file.replace(/\.md$/, '');
            const fullPath = path.join(docsDirectory, file);
            const fileContents = await fs.readFile(fullPath, 'utf8');
            const { data } = matter(fileContents);
            return {
                title: data.title || slug.replace(/-/g, ' '),
                slug: slug,
                order: data.order || 99,
            };
        }));
        return docs.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error("Could not read docs directory:", error);
        return [];
    }
}

const markdownStyles = {
    '& h1': { 
        fontSize: { xs: '2rem', md: '2.5rem' }, 
        fontWeight: 700, 
        mb: 4, 
        mt: 2,
        letterSpacing: '-0.02em'
    },
    '& h2': { 
        fontSize: { xs: '1.5rem', md: '1.75rem' }, 
        fontWeight: 600, 
        mb: 2, 
        mt: 4,
        borderBottom: 1,
        borderColor: 'divider',
        pb: 1
    },
    '& h3': { 
        fontSize: { xs: '1.25rem', md: '1.5rem' }, 
        fontWeight: 600, 
        mb: 2, 
        mt: 3 
    },
    '& p': { 
        fontSize: '1rem', 
        lineHeight: 1.7, 
        mb: 2,
        color: 'text.secondary'
    },
    '& ul, & ol': { 
        pl: 4, 
        mb: 2 
    },
    '& li': { 
        mb: 1,
        color: 'text.secondary'
    },
    '& a': { 
        color: 'primary.main', 
        textDecoration: 'none', 
        '&:hover': { 
            textDecoration: 'underline' 
        } 
    },
    '& code': { 
        bgcolor: 'action.hover', 
        color: 'text.primary', 
        px: 0.5, 
        py: 0.25, 
        borderRadius: 1, 
        fontFamily: 'monospace',
        fontSize: '0.875em'
    },
    '& pre': { 
        bgcolor: 'grey.900', 
        color: 'grey.100', 
        p: 2, 
        borderRadius: 2, 
        overflow: 'auto', 
        mb: 3,
        '& code': {
            bgcolor: 'transparent',
            color: 'inherit',
            p: 0
        }
    },
    '& blockquote': {
        borderLeft: 4,
        borderColor: 'primary.main',
        pl: 2,
        ml: 0,
        my: 2,
        fontStyle: 'italic',
        color: 'text.secondary'
    },
    '& img': {
        maxWidth: '100%',
        height: 'auto',
        borderRadius: 2,
        my: 2
    }
};

export default async function DocPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug?.join('/') || 'introducao';
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
    return docs.map(doc => ({
        slug: doc.slug.split('/'),
    }));
}
