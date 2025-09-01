# Arquitetura do Projeto FinWise

Este documento descreve a arquitetura e a estrutura de pastas do projeto FinWise.

## Estrutura de Pastas Principal

```
/src
|-- /app                 # App Router do Next.js
|   |-- /actions.ts      # Server Actions
|   |-- /api             # Rotas de API (se necessário)
|   |-- /globals.css     # Estilos globais e variáveis do Tailwind/ShadCN
|   |-- /layout.tsx      # Layout principal da aplicação
|   |-- /page.tsx        # Página principal (Dashboard)
|   |-- /(pages)         # Grupos de rotas para as outras páginas
|
|-- /ai                  # Lógica relacionada à Inteligência Artificial (Genkit)
|   |-- /flows           # Fluxos de IA (ex: extrair dados, gerar dicas)
|   |-- /genkit.ts       # Configuração do Genkit
|
|-- /components          # Componentes React reutilizáveis
|   |-- /dashboard       # Componentes específicos do Dashboard
|   |-- /import          # Componentes específicos da página de importação
|   |-- /ui              # Componentes base do ShadCN (Button, Card, etc.)
|
|-- /hooks               # Hooks customizados do React
|   |-- use-transactions.ts # Hook para gerenciar o estado das transações
|   |-- use-mobile.ts    # Hook para detectar dispositivos móveis
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
- **Componentes de Funcionalidade (`/components/dashboard`, `/components/import`)**: São componentes que combinam os blocos de UI para construir partes específicas da aplicação. Eles podem conter estado, mas a lógica de negócio principal é geralmente recebida via props ou hooks.
- **Páginas (`/app/**/page.tsx`)**: As páginas são responsáveis por montar o layout usando os componentes de funcionalidade e por conectar a lógica (hooks, server actions) à UI.

## Gerenciamento de Estado

- **Hooks do React**: Para o estado local dos componentes, usamos `useState` e `useEffect`.
- **Hooks Customizados (`/hooks`)**: Para lógicas de estado mais complexas e compartilhadas, criamos hooks customizados. O `useTransactions` é um bom exemplo, encapsulando toda a lógica de busca, filtragem e processamento de dados de transações.
- **URL State**: Filtros e paginação são gerenciados através do estado da URL sempre que possível, para permitir o compartilhamento de links.

## Comunicação com o Backend

- **Server Actions**: Para mutações de dados (criar, atualizar, deletar), usamos Server Actions do Next.js. Isso nos permite chamar funções do servidor diretamente do cliente, de forma segura e sem a necessidade de criar endpoints de API manualmente. O arquivo `src/app/actions.ts` centraliza essas ações.
- **Genkit Flows**: Para interações com a IA, utilizamos fluxos do Genkit definidos em `/ai/flows`. Esses fluxos também são executados no servidor e podem ser chamados a partir de Server Actions.
