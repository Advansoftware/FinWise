import {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Entrar | Gastometria - Dashboard Financeiro Inteligente',
  description: 'Acesse sua conta Gastometria e continue controlando suas finanças com inteligência artificial. Login rápido e seguro.',
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Entrar no Gastometria',
    description: 'Acesse sua conta e continue controlando suas finanças com IA',
    url: 'https://gastometria.com.br/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
