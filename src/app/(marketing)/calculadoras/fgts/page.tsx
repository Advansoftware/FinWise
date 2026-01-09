// src/app/(marketing)/calculadoras/fgts/page.tsx

import { Metadata } from "next";
import { FGTSCalculator } from "./fgts-calculator";

export const metadata: Metadata = {
  title: "Calculadora de FGTS 2024 - Saldo e Multa 40% | Gastometria",
  description:
    "Calcule seu saldo de FGTS, multa de 40% por demissão sem justa causa e simule o rendimento. Calculadora gratuita e atualizada.",
  keywords: [
    "calculadora FGTS",
    "calcular FGTS",
    "saldo FGTS",
    "multa 40 FGTS",
    "multa FGTS demissão",
    "simulador FGTS",
    "FGTS 2024",
    "quanto tenho de FGTS",
    "rendimento FGTS",
  ],
  openGraph: {
    title: "Calculadora de FGTS 2024 - Saldo e Multa 40%",
    description:
      "Calcule seu saldo de FGTS e a multa de 40% por demissão. 100% grátis!",
    type: "website",
  },
};

export default function FGTSPage() {
  return <FGTSCalculator />;
}
