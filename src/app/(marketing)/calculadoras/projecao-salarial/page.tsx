// src/app/(marketing)/calculadoras/projecao-salarial/page.tsx
import type { Metadata } from "next";
import { SalaryProjectionCalculator } from "./salary-projection-calculator";

export const metadata: Metadata = {
  title: "Calculadora de Projeção Salarial 2024 | Gastometria",
  description:
    "Calcule a projeção do seu salário com reajustes anuais. Simule aumentos, inflação e veja a evolução do seu poder de compra ao longo dos anos.",
  keywords: [
    "projeção salarial",
    "aumento salarial",
    "reajuste salário",
    "evolução salarial",
    "simulador salário",
    "inflação salário",
    "calculadora salário futuro",
  ],
  openGraph: {
    title: "Calculadora de Projeção Salarial 2024 | Gastometria",
    description:
      "Simule a evolução do seu salário ao longo dos anos com reajustes e inflação.",
    type: "website",
    url: "https://gastometria.com/calculadoras/projecao-salarial",
    images: [
      {
        url: "/images/og-calculadora-projecao.png",
        width: 1200,
        height: 630,
        alt: "Calculadora de Projeção Salarial Gastometria",
      },
    ],
  },
};

export default function SalaryProjectionCalculatorPage() {
  return <SalaryProjectionCalculator />;
}
