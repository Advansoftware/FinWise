
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="pt-BR" className="dark" style={{fontFamily: "var(--font-inter)"}}>
      <head>
        <title>FinWise - Seu Dashboard Financeiro Inteligente</title>
        <meta name="description" content="Controle suas finanças com inteligência. O FinWise é o seu assistente financeiro pessoal." />
        <meta name="manifest" content="/manifest.json" />
        <meta name="theme-color" content="#09090B" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <Toaster />
      </body>
    </html>
  );
}

    