// src/app/(marketing)/calculadoras/ferias/page.tsx

/**
 * Calculadora de Férias Pública
 * Página otimizada para SEO - atrai usuários do Google
 */

import { Metadata } from "next";
import { PublicVacationCalculator } from "./vacation-calculator";

export const metadata: Metadata = {
  title: "Calculadora de Férias 2024 | Simule o Valor das Suas Férias",
  description:
    "Calcule o valor líquido das suas férias de forma rápida e gratuita. Inclui 1/3 constitucional, descontos de INSS e Imposto de Renda. Atualizado 2024.",
  keywords: [
    "calculadora de férias",
    "calcular férias",
    "valor das férias",
    "1/3 de férias",
    "férias CLT",
    "simulador de férias",
    "quanto vou receber de férias",
    "cálculo de férias 2024",
  ],
  openGraph: {
    title: "Calculadora de Férias 2024 | Gastometria",
    description:
      "Simule o valor das suas férias gratuitamente. Cálculo completo com 1/3 e descontos.",
    type: "website",
  },
};

export default function FeriasPage() {
  return <PublicVacationCalculator />;
}
