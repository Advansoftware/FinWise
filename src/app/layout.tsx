
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
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
        <title>FinWise Dashboard</title>
        <meta name="description" content="Gerencie suas finanças com facilidade." />
        <meta name="manifest" content="/manifest.json" />
        <meta name="theme-color" content="#09090B" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
