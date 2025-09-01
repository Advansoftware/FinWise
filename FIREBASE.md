# Integração com Firebase no FinWise

O Firebase é o coração do backend do FinWise, fornecendo banco de dados, funcionalidades de IA e, futuramente, hospedagem.

## Cloud Firestore

O Firestore é usado como nosso banco de dados NoSQL para armazenar todas as transações e dados do usuário.

### Estrutura de Dados

A principal coleção é `transactions`. Cada documento nesta coleção representa uma única transação e segue a interface `Transaction` definida em `src/lib/types.ts`.

```typescript
interface Transaction {
  id: string; // Gerado automaticamente pelo Firestore
  date: string; // Armazenado como Timestamp, convertido para ISO string no cliente
  item: string;
  category: TransactionCategory;
  subcategory?: string;
  amount: number;
}
```

### Persistência Offline

Uma das funcionalidades mais poderosas que utilizamos é a persistência offline do Firestore.

- **Como Funciona**: O SDK do Firebase mantém um cache local dos dados. Quando o aplicativo está offline, todas as leituras são feitas a partir deste cache. Todas as escritas (adição de novas transações) são enfileiradas localmente.
- **Sincronização Automática**: Assim que o aplicativo restabelece a conexão com a internet, o SDK do Firebase automaticamente:
  1.  Envia todas as transações pendentes da fila para o servidor.
  2.  Atualiza o cache local com os dados mais recentes do servidor.
- **Ativação**: A persistência é ativada no arquivo `src/lib/firebase.ts` com a função `enableIndexedDbPersistence`.

Isso permite uma experiência de usuário contínua, mesmo em conexões de internet instáveis ou inexistentes, tornando o FinWise uma verdadeira Progressive Web App (PWA).

## Genkit para IA

Utilizamos o Genkit, o framework de IA do Firebase, para todas as funcionalidades inteligentes.

- **Fluxos (`/ai/flows`)**: Cada funcionalidade de IA é encapsulada em um "flow". Por exemplo:
  - `extract-receipt-info.ts`: Usa um modelo multimodal (Gemini) para extrair dados estruturados de uma imagem de nota fiscal.
  - `ai-powered-spending-tips.ts`: Usa um modelo de linguagem para analisar os dados de gastos e gerar dicas financeiras.

Esses fluxos são executados no ambiente do servidor e chamados através de Server Actions, garantindo que as chaves de API e a lógica pesada permaneçam seguras no backend.

## PWA e Service Worker

O `sw.js` (Service Worker) na pasta `/public` é responsável por gerenciar o cache de ativos da aplicação (CSS, JS, imagens) e por lidar com as atualizações da PWA.

O componente `PWAUpdater` em `src/components/pwa-updater.tsx` detecta quando um novo Service Worker é instalado e exibe uma notificação para o usuário, permitindo que ele atualize para a nova versão do aplicativo com um único clique.
