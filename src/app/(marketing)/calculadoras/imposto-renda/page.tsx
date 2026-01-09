// src/app/(marketing)/calculadoras/imposto-renda/page.tsx

import { Metadata } from "next";
import { IRCalculator } from "./ir-calculator";

export const metadata: Metadata = {
  title: "Calculadora de Imposto de Renda 2024 - IR na Fonte | Gastometria",
  description:
    "Calcule o Imposto de Renda descontado na fonte com a tabela progressiva 2024. Calculadora gratuita de IRRF.",
  keywords: [
    "calculadora imposto de renda",
    "calculadora IR",
    "IRRF 2024",
    "desconto imposto de renda",
    "tabela IR 2024",
    "imposto de renda salário",
    "simulador IR",
    "quanto pago de imposto de renda",
  ],
  openGraph: {
    title: "Calculadora de Imposto de Renda 2024 - IR na Fonte",
    description:
      "Calcule o IR descontado do seu salário. Tabela progressiva 2024!",
    type: "website",
  },
};

export default function IRPage() {
  return <IRCalculator />;
}
