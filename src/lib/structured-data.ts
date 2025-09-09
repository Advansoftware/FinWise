
export const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Gastometria",
  "description": "Dashboard financeiro inteligente com IA para controle de gastos, orçamentos, metas e análises financeiras automáticas",
  "url": "https://gastometria.com.br",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": ["Web", "PWA", "Android", "iOS"],
  "downloadUrl": "https://gastometria.com.br",
  "softwareVersion": "2.0",
  "releaseNotes": "Nova versão com IA aprimorada e recursos de análise avançada",
  "offers": [
    {
      "@type": "Offer",
      "name": "Plano Básico",
      "price": "0",
      "priceCurrency": "BRL",
      "category": "free",
      "description": "Recursos essenciais para controle financeiro pessoal"
    },
    {
      "@type": "Offer",
      "name": "Plano Plus",
      "price": "19.90",
      "priceCurrency": "BRL",
      "category": "subscription",
      "description": "Recursos avançados de análise e relatórios",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "19.90",
        "priceCurrency": "BRL",
        "unitText": "MONTH"
      }
    },
    {
      "@type": "Offer",
      "name": "Plano Pro",
      "price": "39.90",
      "priceCurrency": "BRL",
      "category": "subscription",
      "description": "IA completa com insights personalizados e automação",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "39.90",
        "priceCurrency": "BRL",
        "unitText": "MONTH"
      }
    }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "Gastometria",
    "url": "https://gastometria.com.br",
    "logo": "https://gastometria.com.br/logo.svg"
  },
  "author": {
    "@type": "Organization",
    "name": "Gastometria Team"
  },
  "featureList": [
    "Dashboard financeiro interativo",
    "Controle de transações ilimitado",
    "Orçamentos inteligentes com sugestões de IA",
    "Metas de economia personalizadas",
    "Assistente de IA para consultas financeiras",
    "Importação automática de extratos bancários",
    "OCR para digitalização de notas fiscais",
    "Relatórios automáticos com insights de IA",
    "Previsão de saldos futuros",
    "Análises financeiras personalizadas",
    "Categorização automática de gastos",
    "Múltiplas carteiras e contas",
    "Dicas de economia baseadas em IA",
    "Alertas de orçamento em tempo real"
  ],
  "inLanguage": "pt-BR",
  "screenshot": "https://gastometria.com.br/screenshot.png",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1247",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Maria Silva"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      },
      "reviewBody": "Excelente app para controle financeiro! A IA realmente ajuda a entender meus gastos."
    }
  ]
};

export const organizationData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Gastometria",
  "url": "https://gastometria.com.br",
  "logo": "https://gastometria.com.br/logo.svg",
  "description": "Plataforma de controle financeiro pessoal com inteligência artificial para gestão inteligente de dinheiro",
  "foundingDate": "2024",
  "sameAs": [
    "https://twitter.com/gastometria",
    "https://linkedin.com/company/gastometria",
    "https://github.com/gastometria",
    "https://instagram.com/gastometria"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "suporte@gastometria.com.br",
    "availableLanguage": ["Portuguese", "pt-BR"],
    "areaServed": "BR"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "BR",
    "addressLocality": "São Paulo",
    "addressRegion": "SP"
  },
  "knowsAbout": [
    "Gestão Financeira Pessoal",
    "Controle de Gastos",
    "Orçamentos Familiares",
    "Inteligência Artificial",
    "Análise de Dados Financeiros",
    "Educação Financeira"
  ]
};

export const websiteData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Gastometria",
  "url": "https://gastometria.com.br",
  "description": "Dashboard financeiro inteligente com IA para controle de gastos e gestão financeira pessoal",
  "inLanguage": "pt-BR",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://gastometria.com.br/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "People interested in personal finance management"
  }
};

export const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://gastometria.com.br"
    }
  ]
};

export const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O Gastometria é gratuito?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim! O Gastometria oferece um plano Básico gratuito com todas as funcionalidades essenciais de controle financeiro. Para recursos avançados com IA, oferecemos planos pagos a partir de R$ 19,90/mês."
      }
    },
    {
      "@type": "Question",
      "name": "Como funciona a inteligência artificial no Gastometria?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nossa IA analisa seus padrões de gastos para gerar relatórios automáticos, sugerir orçamentos personalizados, categorizar transações, extrair dados de notas fiscais e fornecer insights financeiros através do assistente de chat."
      }
    },
    {
      "@type": "Question",
      "name": "Posso importar dados do meu banco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim! O Gastometria suporta importação de extratos bancários nos formatos CSV e OFX. Também oferecemos OCR para digitalizar notas fiscais automaticamente nos planos pagos."
      }
    },
    {
      "@type": "Question",
      "name": "Meus dados financeiros ficam seguros?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutamente! Utilizamos criptografia de ponta, autenticação segura e as melhores práticas de segurança para proteger seus dados. Não compartilhamos informações pessoais com terceiros."
      }
    },
    {
      "@type": "Question",
      "name": "Como a categorização automática funciona?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nossa IA aprende com seus padrões de gasto e categoriza automaticamente novas transações. Você pode treinar o sistema corrigindo categorizações quando necessário, tornando-o cada vez mais preciso."
      }
    },
    {
      "@type": "Question",
      "name": "Posso usar em múltiplos dispositivos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim! O Gastometria é uma aplicação web progressiva (PWA) que funciona em qualquer dispositivo - computador, tablet ou smartphone. Seus dados ficam sincronizados em tempo real."
      }
    }
  ]
};

// Função para gerar dados estruturados de artigos do blog
export const blogPostingData = (post: {
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  author: string;
  category: string;
  url: string;
  readTime?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.description,
  "articleBody": post.content,
  "datePublished": post.publishedAt,
  "dateModified": post.publishedAt,
  "author": {
    "@type": "Organization",
    "name": post.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "Gastometria",
    "logo": {
      "@type": "ImageObject",
      "url": "https://gastometria.com.br/logo.svg",
      "width": "60",
      "height": "60"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": post.url
  },
  "articleSection": post.category,
  "inLanguage": "pt-BR",
  "timeRequired": post.readTime ? `PT${post.readTime}M` : "PT5M",
  "audience": {
    "@type": "Audience",
    "audienceType": "People interested in personal finance"
  },
  "about": {
    "@type": "Thing",
    "name": "Personal Finance Management"
  }
});

// Como usar dados estruturados
export const howToData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Como controlar seus gastos com o Gastometria",
  "description": "Aprenda a usar o Gastometria para ter controle total sobre suas finanças pessoais em poucos passos",
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Smartphone ou computador"
    },
    {
      "@type": "HowToSupply",
      "name": "Conexão com internet"
    },
    {
      "@type": "HowToSupply",
      "name": "Dados bancários ou extratos (opcional)"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Criar conta gratuita",
      "text": "Acesse gastometria.com.br e crie sua conta gratuita em menos de 2 minutos usando email ou Google",
      "url": "https://gastometria.com.br/signup"
    },
    {
      "@type": "HowToStep",
      "name": "Configurar carteiras",
      "text": "Configure suas contas bancárias e carteiras para organizar melhor suas finanças",
      "url": "https://gastometria.com.br/docs/carteiras"
    },
    {
      "@type": "HowToStep",
      "name": "Registrar transações",
      "text": "Adicione suas transações manualmente ou importe extratos bancários nos formatos CSV/OFX",
      "url": "https://gastometria.com.br/docs/transacoes"
    },
    {
      "@type": "HowToStep",
      "name": "Definir orçamentos",
      "text": "Configure orçamentos por categoria para controlar seus gastos mensais",
      "url": "https://gastometria.com.br/docs/orcamentos"
    },
    {
      "@type": "HowToStep",
      "name": "Estabelecer metas",
      "text": "Crie metas de economia e acompanhe seu progresso com a ajuda da IA",
      "url": "https://gastometria.com.br/docs/metas"
    },
    {
      "@type": "HowToStep",
      "name": "Monitorar relatórios",
      "text": "Acompanhe seus gastos através dos relatórios inteligentes e insights da IA",
      "url": "https://gastometria.com.br/docs/relatorios"
    }
  ],
  "totalTime": "PT15M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "BRL",
    "value": "0"
  }
};
