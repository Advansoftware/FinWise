# Integração com Firebase no FinWise

O Firebase é o coração do backend do FinWise, fornecendo banco de dados, funcionalidades de IA e hospedagem.

## Cloud Firestore

O Firestore é usado como nosso banco de dados NoSQL para armazenar todas as transações e as configurações de IA do usuário.

### Estrutura de Dados

- **Coleção `transactions`**: Cada documento nesta coleção representa uma única transação e segue a interface `Transaction` definida em `src/lib/types.ts`.
- **Coleção `settings`**: Um documento específico (`ai`) nesta coleção armazena as configurações de IA do usuário, como o provedor preferido (Ollama, Google AI, OpenAI), o modelo e as chaves de API.

```typescript
// src/lib/types.ts
interface Transaction {
  id: string;
  date: string; // ISO 8601
  item: string;
  category: TransactionCategory;
  subcategory?: string;
  amount: number;
}

interface AISettings {
  provider: 'ollama' | 'googleai' | 'openai';
  ollamaModel?: string;
  googleAIApiKey?: string;
  openAIModel?: 'gpt-3.5-turbo' | 'gpt-4';
  openAIApiKey?: string;
}
```

### Persistência Offline

Uma das funcionalidades mais poderosas que utilizamos é a persistência offline do Firestore.

- **Como Funciona**: O SDK do Firebase mantém um cache local dos dados. Quando o aplicativo está offline, todas as leituras são feitas a partir deste cache. Todas as escritas (adição de novas transações, salvamento de configurações) são enfileiradas localmente.
- **Sincronização Automática**: Assim que o aplicativo restabelece a conexão com a internet, o SDK do Firebase automaticamente envia todas as operações pendentes da fila para o servidor e atualiza o cache local com os dados mais recentes.
- **Ativação**: A persistência é ativada no arquivo `src/lib/firebase.ts` com a função `enableIndexedDbPersistence`.

Isso permite uma experiência de usuário contínua, mesmo em conexões de internet instáveis ou inexistentes, tornando o FinWise uma verdadeira Progressive Web App (PWA).

## Genkit para IA

Utilizamos o Genkit, o framework de IA do Firebase, para todas as funcionalidades inteligentes.

- **Fluxos (`/ai/flows`)**: Cada funcionalidade de IA é encapsulada em um "flow". Por exemplo:
  - `extract-receipt-info.ts`: Usa um modelo multimodal para extrair dados de uma imagem de nota fiscal.
  - `ai-powered-spending-tips.ts`: Analisa dados de gastos e gera dicas financeiras.
  - `chat-with-transactions.ts`: O cérebro do chatbot, que analisa transações para responder perguntas.
- **Configuração Dinâmica**: Os fluxos são projetados para serem flexíveis. Eles recebem as configurações de IA (salvas no Firestore) como um argumento. Isso permite que a `Server Action` que chama o fluxo primeiro busque as configurações do usuário e, em seguida, configure dinamicamente o Genkit para usar o provedor e modelo corretos (Ollama, Google AI ou OpenAI) para aquela execução específica.

Essa arquitetura mantém as chaves de API e a lógica pesada seguras no backend.

## PWA e Service Worker

O `sw.js` (Service Worker) na pasta `/public` é responsável por gerenciar o cache de ativos da aplicação (páginas, CSS, JS, ícones) para permitir o uso offline.

O componente `PWAUpdater` em `src/components/pwa-updater.tsx` detecta quando um novo Service Worker é instalado (ou seja, uma nova versão do aplicativo foi implantada) e exibe uma notificação para o usuário, permitindo que ele atualize para a nova versão com um único clique.
