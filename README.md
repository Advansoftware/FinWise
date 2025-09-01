# FinWise - Seu Dashboard Financeiro Inteligente

Bem-vindo ao FinWise, um dashboard de finanças pessoais moderno, construído com as tecnologias mais recentes para fornecer uma experiência de usuário rápida, intuitiva e poderosa.

Este projeto foi desenvolvido com o Firebase Studio e serve como um exemplo robusto de como construir uma aplicação web completa com Next.js (App Router), TypeScript, Tailwind CSS, ShadCN para componentes de UI, e Genkit (Firebase) para funcionalidades de IA.

## Funcionalidades Principais

- **Dashboard Interativo**: Visualize seus gastos totais, principais categorias de despesa e transações recentes em um piscar de olhos.
- **Visualização de Dados**: Gráficos interativos que ajudam a entender seus padrões de gastos ao longo do tempo.
- **Gerenciamento de Transações**: Adicione, visualize e filtre suas transações com facilidade.
- **Categorização Inteligente**: Organize suas despesas com categorias e subcategorias personalizáveis.
- **Importação Flexível**:
  - **OCR de Notas Fiscais**: Tire uma foto de uma nota fiscal e a IA extrairá as informações para você.
  - **Importação de CSV**: Envie extratos bancários em formato CSV com um mapeador de colunas inteligente.
  - **Importação de OFX**: Suporte para o formato padrão de extratos financeiros.
- **Dicas Financeiras com IA**: Receba dicas personalizadas geradas por IA com base nos seus hábitos de consumo.
- **Progressive Web App (PWA)**: Instale o aplicativo no seu desktop ou celular e use-o offline.
- **Sincronização Offline**: Todas as alterações feitas sem conexão são salvas localmente e sincronizadas automaticamente quando a internet é restabelecida.
- **Design Moderno**: Interface inspirada em designs de fintechs modernas, com tema escuro e foco na experiência do usuário.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI**: [ShadCN/UI](https://ui.shadcn.com/)
- **Banco de Dados**: [Cloud Firestore](https://firebase.google.com/docs/firestore) (com suporte offline)
- **Inteligência Artificial**: [Genkit (Firebase AI)](https://firebase.google.com/docs/genkit)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Deployment**: [Firebase App Hosting](https://firebase.google.com/docs/hosting)

## Como Começar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

1.  Clone o repositório:
    ```bash
    git clone <URL_DO_REPOSITÓRIO>
    ```
2.  Navegue até o diretório do projeto:
    ```bash
    cd finwise-dashboard
    ```
3.  Instale as dependências:
    ```bash
    npm install
    ```

### Configuração do Firebase

Este projeto é configurado para usar o Firebase. As credenciais já estão incluídas no arquivo `src/lib/firebase.ts`. Quando executado pela primeira vez, ele se conectará a um projeto Firebase provisionado.

### Executando o Aplicativo

Para iniciar o servidor de desenvolvimento, execute:

```bash
npm run dev
```

Abra [http://localhost:9002](http://localhost:9002) no seu navegador para ver a aplicação em funcionamento.

## Estrutura do Projeto

Para entender mais sobre a arquitetura, padrões de código e como o Firebase está integrado, consulte os seguintes documentos:

- [`ARCHITECTURE.md`](./ARCHITECTURE.md): Detalhes sobre a estrutura de pastas e a lógica dos componentes.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md): Diretrizes para contribuir com o projeto.
- [`FIREBASE.md`](./FIREBASE.md): Explicação aprofundada da integração com o Firebase.
