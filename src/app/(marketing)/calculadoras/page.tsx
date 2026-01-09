// src/app/(marketing)/calculadoras/page.tsx

/**
 * Página pública de calculadoras financeiras
 * Landing page para SEO - atrai usuários que buscam calculadoras no Google
 */

import { Metadata } from "next";
import { CalculadorasContent } from "./calculadoras-content";

export const metadata: Metadata = {
  title: "Calculadoras Financeiras Grátis | Gastometria",
  description:
    "Calculadoras financeiras gratuitas: Férias, 13º Salário, Rescisão, FGTS, INSS, Imposto de Renda e muito mais. Simule e planeje suas finanças.",
  keywords: [
    "calculadora de férias",
    "calculadora 13º salário",
    "calculadora rescisão",
    "calculadora FGTS",
    "calculadora INSS",
    "calculadora imposto de renda",
    "simulador financeiro",
    "planejamento financeiro",
  ],
  openGraph: {
    title: "Calculadoras Financeiras Grátis | Gastometria",
    description:
      "Simule férias, 13º salário, rescisão e muito mais. 100% grátis!",
    type: "website",
  },
};

export default function CalculadorasPage() {
  return <CalculadorasContent />;
}
