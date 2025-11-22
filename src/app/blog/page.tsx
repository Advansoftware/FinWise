import {Metadata} from 'next';
import Link from 'next/link';
import {Card, CardContent, CardHeader, Typography} from '@mui/material';
import {Chip} from '@mui/material';
import {CalendarDays, Clock, ArrowRight} from 'lucide-react';
import {Button} from '@mui/material';

export const metadata: Metadata = {
  title: 'Blog | Gastometria - Dicas de Educação Financeira e IA',
  description: 'Artigos sobre educação financeira, dicas de controle de gastos, como usar IA nas finanças pessoais e muito mais no blog do Gastometria.',
  openGraph: {
    title: 'Blog Gastometria - Educação Financeira e IA',
    description: 'Aprenda sobre finanças pessoais, controle de gastos e como usar inteligência artificial para melhorar sua vida financeira.',
    url: 'https://gastometria.com.br/blog',
  },
};

const blogPosts = [
  {
    id: 1,
    title: '10 Dicas Essenciais para Controlar seus Gastos em 2025',
    description: 'Descubra estratégias práticas e eficazes para manter suas finanças organizadas e alcançar seus objetivos financeiros.',
    category: 'Educação Financeira',
    readTime: 8,
    publishedAt: '2025-01-15',
    slug: 'controlar-gastos-2025',
    featured: true,
  },
  {
    id: 2,
    title: 'Como a Inteligência Artificial Pode Revolucionar suas Finanças',
    description: 'Entenda como a IA pode ajudar no controle financeiro, análise de gastos e tomada de decisões inteligentes.',
    category: 'Tecnologia',
    readTime: 12,
    publishedAt: '2025-01-10',
    slug: 'ia-revoluciona-financas',
    featured: true,
  },
  {
    id: 3,
    title: 'Orçamento 50/30/20: O Método que Funciona de Verdade',
    description: 'Aprenda a aplicar a regra 50/30/20 na prática e organize suas finanças de forma simples e eficiente.',
    category: 'Planejamento',
    readTime: 6,
    publishedAt: '2025-01-05',
    slug: 'orcamento-50-30-20',
    featured: false,
  },
  {
    id: 4,
    title: 'Metas Financeiras SMART: Como Definir e Alcançar seus Objetivos',
    description: 'Use a metodologia SMART para criar metas financeiras realistas e atingíveis em 2025.',
    category: 'Planejamento',
    readTime: 10,
    publishedAt: '2024-12-28',
    slug: 'metas-financeiras-smart',
    featured: false,
  },
  {
    id: 5,
    title: 'OCR para Notas Fiscais: Como Digitalizar suas Despesas Automaticamente',
    description: 'Descubra como usar tecnologia OCR para registrar suas compras automaticamente e economizar tempo.',
    category: 'Tecnologia',
    readTime: 7,
    publishedAt: '2024-12-20',
    slug: 'ocr-notas-fiscais',
    featured: false,
  },
  {
    id: 6,
    title: 'Investimentos para Iniciantes: Por Onde Começar em 2025',
    description: 'Guia completo para quem quer começar a investir, com dicas práticas e estratégias seguras.',
    category: 'Investimentos',
    readTime: 15,
    publishedAt: '2024-12-15',
    slug: 'investimentos-iniciantes-2025',
    featured: false,
  },
];

const categories = ['Todos', 'Educação Financeira', 'Tecnologia', 'Planejamento', 'Investimentos'];

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

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Blog Gastometria
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Artigos sobre educação financeira, tecnologia e dicas práticas para 
              transformar sua relação com o dinheiro.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Chip key={category} label={category} variant="outlined" className="cursor-pointer hover:bg-primary hover:text-primary-foreground" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Artigos em Destaque</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Chip className={getCategoryColor(post.category)}>
                        {post.category}
                      </Chip>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime} min
                      </div>
                    </div>
                    <Typography variant="h6" className="group-hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="text-base">
                      {post.description}
                    </Typography>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        {formatDate(post.publishedAt)}
                      </div>
                      <Button variant="text" size="small" asChild>
                        <Link href={`/blog/${post.slug}`}>
                          Ler mais
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Regular Posts */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Todos os Artigos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Chip variant="outlined" className={getCategoryColor(post.category)}>
                      {post.category}
                    </Chip>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {post.readTime} min
                    </div>
                  </div>
                  <Typography variant="h6" className="text-lg group-hover:text-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {post.description}
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      {formatDate(post.publishedAt)}
                    </div>
                    <Button variant="text" size="small" asChild>
                      <Link href={`/blog/${post.slug}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="mt-16 bg-card rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Receba dicas financeiras direto no seu email
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Cadastre-se em nossa newsletter e receba semanalmente artigos exclusivos 
            sobre educação financeira, dicas de economia e novidades do Gastometria.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Seu melhor email"
              className="flex-1 px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button>
              Inscrever-se
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
