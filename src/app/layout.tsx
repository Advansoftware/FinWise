
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/use-auth';
import { PWAUpdater } from '@/components/pwa-updater';
import { Metadata, Viewport } from 'next';
import { structuredData, organizationData, websiteData } from '@/lib/structured-data';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Gastometria - Dashboard Financeiro Inteligente com IA',
    template: '%s | Gastometria'
  },
  description: 'Controle suas finanças pessoais com inteligência artificial. Dashboard completo para gestão de gastos, orçamentos, metas e análises financeiras automáticas.',
  keywords: [
    'finanças pessoais',
    'controle financeiro',
    'dashboard financeiro',
    'inteligência artificial',
    'gestão de gastos',
    'orçamento pessoal',
    'análise financeira',
    'planejamento financeiro',
    'app financeiro',
    'controle de despesas',
    'metas financeiras',
    'educação financeira',
    'gastometria',
    'fintech',
    'pwa financeiro',
    'IA financeira',
    'categorização automática',
    'relatórios automáticos',
    'previsão financeira',
    'importação bancária',
    'OCR nota fiscal',
    'assistente financeiro IA'
  ],
  authors: [{ name: 'Gastometria Team' }],
  creator: 'Gastometria',
  publisher: 'Gastometria',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://gastometria.com.br',
    siteName: 'Gastometria',
    title: 'Gastometria - Dashboard Financeiro Inteligente com IA',
    description: 'Controle suas finanças pessoais com inteligência artificial. Dashboard completo para gestão de gastos, orçamentos e análises automáticas.',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Gastometria - Dashboard Financeiro Inteligente',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gastometria - Dashboard Financeiro Inteligente com IA',
    description: 'Controle suas finanças pessoais com IA. Dashboard completo para gestão de gastos, orçamentos e análises automáticas.',
    images: ['/logo.svg'],
    creator: '@gastometria',
  },
  manifest: '/manifest.json',
  other: {
    'google-site-verification': 'SEU_GOOGLE_VERIFICATION_CODE',
  },
  alternates: {
    canonical: 'https://gastometria.com.br',
    languages: {
      'pt-BR': 'https://gastometria.com.br',
    },
  },
  category: 'finance',
  applicationName: 'Gastometria',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://gastometria.com.br'),
  classification: 'Finance Application'
};

export const viewport: Viewport = {
  themeColor: '#09090B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="pt-BR" className="dark" style={{fontFamily: "var(--font-inter)"}}>
      <head>
        {/* Favicon and Icons */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
        
        {/* Structured Data - Software Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationData),
          }}
        />
        
        {/* Structured Data - Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteData),
          }}
        />
        
        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for External Resources */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//googletagmanager.com" />
        
        {/* Additional Meta Tags */}
        <meta name="referrer" content="origin-when-cross-origin" />
        <meta name="theme-color" content="#09090B" />
        <meta name="color-scheme" content="dark light" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gastometria" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
          <AuthProvider>
            {children}
            <PWAUpdater />
          </AuthProvider>
          <Toaster />
      </body>
    </html>
  );
}
