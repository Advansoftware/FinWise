// src/app/(marketing)/calculadoras/pos-ferias/page.tsx
import type { Metadata } from "next";
import { PostVacationCalculator } from "./post-vacation-calculator";

export const metadata: Metadata = {
  title: "Calculadora Pós-Férias 2024 - Primeiro Salário | Gastometria",
  description:
    "Calcule quanto você vai receber no primeiro salário após as férias. Entenda os descontos e planeje seu orçamento para o retorno ao trabalho.",
  keywords: [
    "salário pós férias",
    "primeiro salário após férias",
    "desconto pós férias",
    "quanto recebo após férias",
    "calculadora retorno férias",
    "salário depois das férias",
    "férias CLT desconto",
  ],
  openGraph: {
    title: "Calculadora Pós-Férias 2024 | Gastometria",
    description:
      "Descubra quanto você vai receber no primeiro salário após as férias.",
    type: "website",
    url: "https://gastometria.com/calculadoras/pos-ferias",
    images: [
      {
        url: "/images/og-calculadora-pos-ferias.png",
        width: 1200,
        height: 630,
        alt: "Calculadora Pós-Férias Gastometria",
      },
    ],
  },
};

export default function PostVacationCalculatorPage() {
  return <PostVacationCalculator />;
}
