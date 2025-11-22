import {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft, CalendarDays, Clock, Share2} from 'lucide-react';
import {Button} from '@mui/material';
import {Chip} from '@mui/material';
import {Divider} from '@mui/material';

// Mock data - em produção isso viria do CMS
const blogPosts: Record<string, any> = {
  'controlar-gastos-2025': {
    title: '10 Dicas Essenciais para Controlar seus Gastos em 2025',
    description: 'Descubra estratégias práticas e eficazes para manter suas finanças organizadas e alcançar seus objetivos financeiros.',
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
    category: 'Educação Financeira',
    readTime: 8,
    publishedAt: '2025-01-15',
    author: 'Equipe Gastometria',
  },
};

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = blogPosts[params.slug];
  
  if (!post) {
    return {
      title: 'Artigo não encontrado | Blog Gastometria',
    };
  }

  return {
    title: `${post.title} | Blog Gastometria`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://gastometria.com.br/blog/${params.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = blogPosts[params.slug];

  if (!post) {
    notFound();
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      'Educação Financeira': 'bg-green-100 text-green-800',
      'Tecnologia': 'bg-blue-100 text-blue-800',
      'Planejamento': 'bg-purple-100 text-purple-800',
      'Investimentos': 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="text" className="mb-6">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Blog
          </Link>
        </Button>

        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Chip className={getCategoryColor(post.category)}>
                {post.category}
              </Chip>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {post.readTime} min de leitura
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground mb-6">
              {post.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {formatDate(post.publishedAt)}
                </div>
                <span>•</span>
                <span>Por {post.author}</span>
              </div>

              <Button variant="outlined" size="small">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </header>

          <Divider className="mb-8" />

          {/* Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }} />
          </div>

          <Divider className="my-12" />

          {/* CTA */}
          <div className="bg-card rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Gostou do artigo? Experimente o Gastometria!
            </h2>
            <p className="text-muted-foreground mb-6">
              Coloque essas dicas em prática com nosso dashboard financeiro inteligente. 
              Comece gratuitamente e transforme sua vida financeira.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="large">
                <Link href="/signup">
                  Criar Conta Grátis
                </Link>
              </Button>
              <Button variant="outlined" size="large">
                <Link href="/docs">
                  Ver Documentação
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
