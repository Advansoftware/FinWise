import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Perguntas Frequentes | Gastometria",
  description:
    "Tire todas suas dúvidas sobre o Gastometria. Respostas para as perguntas mais frequentes sobre controle financeiro, IA, segurança e muito mais.",
  keywords: [
    "faq",
    "dúvidas",
    "perguntas frequentes",
    "ajuda",
    "suporte",
    "tutorial",
    "como usar",
  ],
  openGraph: {
    title: "FAQ - Perguntas Frequentes sobre Gastometria",
    description:
      "Tire todas suas dúvidas sobre controle financeiro inteligente, IA, segurança e funcionalidades do Gastometria.",
    url: "https://gastometria.com.br/faq",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
