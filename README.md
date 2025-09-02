# FinWise - Seu Dashboard Financeiro Inteligente

Bem-vindo ao FinWise, um dashboard de finanças pessoais moderno, construído com as tecnologias mais recentes para fornecer uma experiência de usuário rápida, intuitiva e poderosa.

Este projeto foi desenvolvido com o Firebase Studio e serve como um exemplo robusto de como construir uma aplicação web completa com Next.js (App Router), TypeScript, Tailwind CSS, ShadCN para componentes de UI, e Genkit (Firebase) para funcionalidades de IA.

## Funcionalidades Principais

- **Dashboard Interativo**: Visualize seus gastos totais, principais categorias de despesa e transações recentes em um piscar de olhos.
- **Visualização de Dados**: Gráficos interativos que ajudam a entender seus padrões de gastos ao longo do tempo.
- **Gerenciamento de Transações**: Adicione, visualize e filtre suas transações com facilidade.
- **Categorização Inteligente**: Organize suas despesas com categorias e subcategorias personalizáveis.
- **Configuração de IA Flexível**: Escolha entre múltiplos provedores de IA (Ollama, Google AI, OpenAI) e configure modelos diretamente na interface.
- **Assistente de Chat com IA**: Converse com um assistente inteligente que analisa suas transações em tempo real para responder perguntas e fornecer insights.
- **OCR de Notas Fiscais**: Tire uma foto de uma nota fiscal e a IA extrairá as informações para você.
- **Progressive Web App (PWA)**: Instale o aplicativo no seu desktop ou celular e use-o offline.
- **Sincronização Offline**: Todas as alterações feitas sem conexão são salvas localmente e sincronizadas automaticamente quando a internet é restabelecida.
- **Atualização da PWA**: Seja notificado quando uma nova versão do aplicativo estiver disponível, com um botão para atualizar instantaneamente.
- **Design Moderno**: Interface inspirada em designs de fintechs modernas, com tema escuro e foco na experiência do usuário.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI**: [ShadCN/UI](https://ui.shadcn.com/)
- **Banco de Dados**: [Cloud Firestore](https://firebase.google.com/docs/firestore) (com suporte offline)
- **Inteligência Artificial**: [Genkit (Firebase AI)](https://firebase.google.com/docs/genkit) com suporte a Ollama, Google AI e OpenAI.
- **Gráficos**: [Recharts](https://recharts.org/)
- **Deployment**: [Firebase App Hosting](https://firebase.google.com/docs/hosting)

## Como Começar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

1.  Clone o repositório:
    ```bash
    git clone git@github.com:Advansoftware/FinWise.git
    ```
2.  Navegue até o diretório do projeto:
    ```bash
    cd FinWise
    ```
3.  Instale as dependências:
    ```bash
    npm install
    ```

### Configuração do Firebase

Este projeto é configurado para usar o Firebase. As credenciais já estão incluídas no arquivo `src/lib/firebase.ts`. Quando executado pela primeira vez, ele se conectará a um projeto Firebase provisionado.

**IMPORTANTE: Configurando as Regras de Segurança do Firestore**

Para que o aplicativo funcione, você **DEVE** configurar as regras de segurança do Cloud Firestore para permitir que os usuários acessem seus próprios dados.

1.  Acesse o **Console do Firebase** e selecione seu projeto.
2.  Vá para **Build > Cloud Firestore**.
3.  Se você ainda não o fez, clique em **Criar banco de dados** e siga as instruções para ativá-lo.
4.  Vá para a aba **Regras**.
5.  Substitua o conteúdo existente pelas seguintes regras:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Permite que um usuário leia e escreva apenas em seus próprios documentos
        match /users/{userId}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
6.  Clique em **Publicar**. Após alguns instantes, o aplicativo terá as permissões corretas.


### Configuração de IA (Opcional)

- **Ollama**: Se você planeja usar o Ollama, certifique-se de que ele esteja instalado e em execução em sua máquina local. O aplicativo buscará automaticamente os modelos disponíveis.
- **Google AI / OpenAI**: Para usar esses provedores, você precisará de uma chave de API. Vá para a página de **Configurações** no aplicativo para inserir e salvar suas chaves com segurança no Firestore.

### Executando o Aplicativo

Para iniciar o servidor de desenvolvimento, execute:

```bash
npm run dev
```

Abra [http://localhost:9002](http://localhost:9002) no seu navegador para ver a aplicação em funcionamento.

## Contribuição

Ficamos felizes com o seu interesse em contribuir! Por favor, consulte nosso [`CONTRIBUTING.md`](./CONTRIBUTING.md) para diretrizes detalhadas sobre como participar do projeto.

## Estrutura do Projeto

Para entender mais sobre a arquitetura, padrões de código e como o Firebase está integrado, consulte os seguintes documentos:

- [`ARCHITECTURE.md`](./ARCHITECTURE.md): Detalhes sobre a estrutura de pastas e a lógica dos componentes.
- [`FIREBASE.md`](./FIREBASE.md): Explicação aprofundada da integração com o Firebase.
