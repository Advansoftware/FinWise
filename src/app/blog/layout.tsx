import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Gastometria - Dicas de Educação Financeira e IA",
  description:
    "Artigos sobre educação financeira, dicas de controle de gastos, como usar IA nas finanças pessoais e muito mais no blog do Gastometria.",
  openGraph: {
    title: "Blog Gastometria - Educação Financeira e IA",
    description:
      "Aprenda sobre finanças pessoais, controle de gastos e como usar inteligência artificial para melhorar sua vida financeira.",
    url: "https://gastometria.com.br/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
