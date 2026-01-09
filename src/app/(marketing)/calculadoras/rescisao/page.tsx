// src/app/(marketing)/calculadoras/rescisao/page.tsx

import { Metadata } from "next";
import { PublicSeveranceCalculator } from "./severance-calculator";

export const metadata: Metadata = {
  title: "Calculadora de Rescisão 2024 | Simule Sua Demissão",
  description:
    "Calcule todos os valores da sua rescisão trabalhista: saldo de salário, férias proporcionais, 13º proporcional, aviso prévio e multa do FGTS. Grátis!",
  keywords: [
    "calculadora de rescisão",
    "calcular rescisão",
    "demissão sem justa causa",
    "multa FGTS",
    "aviso prévio",
    "férias proporcionais",
    "rescisão trabalhista",
    "valores rescisão CLT",
  ],
  openGraph: {
    title: "Calculadora de Rescisão 2024 | Gastometria",
    description:
      "Simule todos os valores da sua rescisão trabalhista gratuitamente.",
    type: "website",
  },
};

export default function RescisaoPage() {
  return <PublicSeveranceCalculator />;
}
