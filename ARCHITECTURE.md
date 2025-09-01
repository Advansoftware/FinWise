# Arquitetura do Projeto FinWise

Este documento descreve a arquitetura e a estrutura de pastas do projeto FinWise.

## Estrutura de Pastas Principal

```
/src
|-- /app                 # App Router do Next.js
|   |-- /actions.ts      # Server Actions (interação com DB e IA)
|   |-- /api             # Rotas de API (se necessário)
|   |-- /globals.css     # Estilos globais e variáveis do Tailwind/ShadCN
|   |-- /layout.tsx      # Layout principal da aplicação
|   |-- /page.tsx        # Página principal (Dashboard)
|   |-- /(pages)         # Grupos de rotas para as outras páginas
|
|-- /ai                  # Lógica relacionada à Inteligência Artificial (Genkit)
|   |-- /flows           # Fluxos de IA (dicas, chat, OCR)
|   |-- /genkit.ts       # Configuração do Genkit
|
|-- /components          # Componentes React reutilizáveis
|   |-- /chat            # Componentes do assistente de chat
|   |-- /dashboard       # Componentes específicos do Dashboard
|   |-- /import          # Componentes específicos da página de importação
|   |-- /ui              # Componentes base do ShadCN (Button, Card, etc.)
|
|-- /hooks               # Hooks customizados do React
|   |-- use-transactions.ts # Hook para gerenciar o estado das transações
|   |-- use-mobile.ts    # Hook para detectar dispositivos móveis
|   |-- use-toast.ts     # Hook para gerenciar notificações
|
|-- /lib                 # Funções utilitárias e configurações
|   |-- /firebase.ts     # Configuração e inicialização do Firebase SDK
|   |-- /types.ts        # Definições de tipos e interfaces do TypeScript
|   |-- /utils.ts        # Funções utilitárias (ex: `cn` para classnames)
|
/public                  # Arquivos estáticos
|-- /manifest.json       # Manifesto da PWA
|-- /sw.js               # Service Worker
|-- /icons               # Ícones da PWA
```

## Componentização

O projeto segue uma forte política de componentização.

- **Componentes de UI (`/components/ui`)**: São os blocos de construção básicos, fornecidos pelo ShadCN/UI. Eles são agnósticos em relação à lógica de negócio.
- **Componentes de Funcionalidade (`/components/dashboard`, etc.)**: São componentes que combinam os blocos de UI para construir partes específicas da aplicação. Eles podem conter estado, mas a lógica de negócio principal é geralmente recebida via props ou hooks.
- **Páginas (`/app/**/page.tsx`)**: As páginas são responsáveis por montar o layout usando os componentes de funcionalidade e por conectar a lógica (hooks, server actions) à UI.

## Gerenciamento de Estado

- **Hooks do React**: Para o estado local dos componentes, usamos `useState` e `useEffect`.
- **Hooks Customizados (`/hooks`)**: Para lógicas de estado mais complexas e compartilhadas, criamos hooks customizados. O `useTransactions` é um bom exemplo, encapsulando toda a lógica de busca, filtragem e processamento de dados de transações.
- **URL State**: Filtros e paginação são gerenciados através do estado da URL sempre que possível, para permitir o compartilhamento de links.

## Comunicação com o Backend

- **Server Actions (`/app/actions.ts`)**: Para mutações de dados (criar, atualizar, deletar) e chamadas seguras para a IA, usamos Server Actions do Next.js. Isso nos permite chamar funções do servidor diretamente do cliente de forma segura, sem a necessidade de criar endpoints de API manualmente.
- **Genkit Flows (`/ai/flows`)**: Para interações com a IA, utilizamos fluxos do Genkit. Esses fluxos são executados no ambiente do servidor e são chamados através de Server Actions. Eles são dinamicamente configurados para usar diferentes provedores (Ollama, Google AI, OpenAI) com base nas configurações salvas pelo usuário no Firestore.

## Funcionalidade Offline (PWA)

O aplicativo é uma Progressive Web App (PWA) e utiliza a persistência offline do Firestore. Isso significa que o aplicativo pode ser usado sem conexão com a internet, com todas as alterações sendo salvas localmente e sincronizadas automaticamente quando a conexão é restabelecida. Consulte o `FIREBASE.md` para mais detalhes.
