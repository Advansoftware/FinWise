// src/app/(marketing)/calculadoras/inss/page.tsx

import { Metadata } from "next";
import { INSSCalculator } from "./inss-calculator";

export const metadata: Metadata = {
  title: "Calculadora de INSS 2024 - Desconto e Alíquotas | Gastometria",
  description:
    "Calcule o desconto do INSS no seu salário com as alíquotas atualizadas de 2024. Calculadora gratuita com tabela progressiva.",
  keywords: [
    "calculadora INSS",
    "desconto INSS",
    "alíquota INSS 2024",
    "tabela INSS",
    "INSS salário",
    "contribuição INSS",
    "quanto desconta INSS",
    "simulador INSS",
  ],
  openGraph: {
    title: "Calculadora de INSS 2024 - Desconto e Alíquotas",
    description:
      "Calcule o desconto do INSS no seu salário. Alíquotas 2024 atualizadas!",
    type: "website",
  },
};

export default function INSSPage() {
  return <INSSCalculator />;
}
