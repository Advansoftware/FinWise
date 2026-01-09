// src/app/(marketing)/calculadoras/decimo-terceiro/page.tsx

import { Metadata } from "next";
import { PublicThirteenthSalaryCalculator } from "./thirteenth-calculator";

export const metadata: Metadata = {
  title: "Calculadora de 13º Salário 2024 | Simule Seu Décimo Terceiro",
  description:
    "Calcule o valor do seu 13º salário de forma rápida e gratuita. Simule a 1ª e 2ª parcela com todos os descontos de INSS e IR. Atualizado 2024.",
  keywords: [
    "calculadora 13 salário",
    "décimo terceiro salário",
    "13º salário 2024",
    "primeira parcela 13",
    "segunda parcela 13",
    "calcular décimo terceiro",
    "simulador 13 salário",
  ],
  openGraph: {
    title: "Calculadora de 13º Salário 2024 | Gastometria",
    description:
      "Simule o valor do seu décimo terceiro gratuitamente. Cálculo da 1ª e 2ª parcela.",
    type: "website",
  },
};

export default function DecimoTerceiroPage() {
  return <PublicThirteenthSalaryCalculator />;
}
