import {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Criar Conta | Gastometria - Dashboard Financeiro Inteligente',
  description: 'Crie sua conta gratuita no Gastometria e comece a controlar suas finanças com inteligência artificial. Cadastro rápido e fácil.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Criar Conta no Gastometria',
    description: 'Comece a controlar suas finanças com IA. Cadastro gratuito!',
    url: 'https://gastometria.com.br/signup',
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
