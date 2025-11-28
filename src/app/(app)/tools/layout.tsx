import {Metadata} from 'next';
import {financialToolsData, vacationCalculatorData, thirteenthSalaryCalculatorData, salaryProjectionCalculatorData} from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Ferramentas Financeiras - Calculadora de Férias, 13º Salário e Projeção Salarial',
  description: 'Calculadoras trabalhistas gratuitas: férias, 13º salário (décimo terceiro) e projeção salarial. Ferramentas online baseadas na CLT para planejamento financeiro.',
  keywords: [
    'calculadora de férias',
    'calculadora 13º salário',
    'calculadora décimo terceiro',
    'calculadora trabalhista',
    'projeção salarial',
    'simulador salarial',
    'calculadora financeira',
    'ferramentas trabalhistas',
    'cálculo trabalhista online',
    'simulador de férias',
    'calculadora CLT',
    'ferramentas financeiras gratuitas'
  ],
  openGraph: {
    title: 'Ferramentas Financeiras - Calculadoras Trabalhistas Gratuitas',
    description: 'Calculadoras de férias, 13º salário e projeção salarial. Ferramentas trabalhistas gratuitas baseadas na CLT.',
    url: 'https://gastometria.com.br/tools',
    type: 'website',
  },
  twitter: {
    title: 'Calculadoras Financeiras - Férias, 13º Salário e Projeção Salarial',
    description: 'Ferramentas trabalhistas gratuitas: calculadora de férias, 13º salário e projeção salarial online.',
  },
  alternates: {
    canonical: 'https://gastometria.com.br/tools',
  },
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Structured Data - Financial Tools Application */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(financialToolsData),
        }}
      />
      
      {/* Structured Data - Vacation Calculator */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(vacationCalculatorData),
        }}
      />
      
      {/* Structured Data - 13th Salary Calculator */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(thirteenthSalaryCalculatorData),
        }}
      />
      
      {/* Structured Data - Salary Projection Calculator */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(salaryProjectionCalculatorData),
        }}
      />
      
      {children}
    </>
  );
}