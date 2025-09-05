# 🏗️ Arquitetura Hexagonal do FinWise

## 📋 Visão Geral

O FinWise agora implementa uma **arquitetura hexagonal** (também conhecida como Ports and Adapters) que permite alternar entre diferentes provedores de banco de dados e autenticação através de uma simples configuração no arquivo `.env`.

## 🔄 Como Alternar entre Bancos

### Firebase (Padrão)
```env
DATABASE_TYPE=firebase
```

### MongoDB
```env
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=finwise
```

## 🏛️ Estrutura da Arquitetura

```
src/core/
├── ports/                    # Interfaces (contratos)
│   ├── database.port.ts     # Interface do banco de dados
│   ├── auth.port.ts         # Interface de autenticação
│   └── index.ts
├── adapters/                # Implementações específicas
│   ├── firebase/
│   │   ├── firebase.adapter.ts
│   │   ├── firebase-auth.adapter.ts
│   │   └── index.ts
│   └── mongodb/
│       ├── mongodb.adapter.ts
│       ├── mongodb-auth.adapter.ts
│       └── index.ts
└── services/
    └── service-factory.ts   # Factory para criar serviços
```

## 🔌 Ports (Interfaces)

### IDatabaseAdapter
Define o contrato para acesso a dados:
```typescript
interface IDatabaseAdapter {
  users: IUserRepository;
  transactions: ITransactionRepository;
  wallets: IWalletRepository;
  budgets: IBudgetRepository;
  aiCreditLogs: IAICreditLogRepository;
  settings: ISettingsRepository;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  withTransaction<T>(operation: () => Promise<T>): Promise<T>;
}
```

### IAuthService
Define o contrato para autenticação:
```typescript
interface IAuthService {
  signUp(data: SignUpData): Promise<{ user: any; success: boolean; error?: string }>;
  signIn(data: LoginData): Promise<{ user: any; success: boolean; error?: string }>;
  signOut(): Promise<{ success: boolean; error?: string }>;
  resetPassword(email: string): Promise<{ success: boolean; error?: string }>;
  updateUserProfile(userId: string, updates: any): Promise<{ success: boolean; error?: string }>;
  changePassword(newPassword: string): Promise<{ success: boolean; error?: string }>;
  getCurrentUser(): Promise<any>;
  deleteAccount(userId: string): Promise<{ success: boolean; error?: string }>;
  onAuthStateChanged(callback: (user: any) => void): () => void;
}
```

## 🛠️ Adapters (Implementações)

### Firebase Adapter
- **FirebaseAdapter**: Implementa IDatabaseAdapter usando Firestore
- **FirebaseAuthService**: Implementa IAuthService usando Firebase Auth

### MongoDB Adapter  
- **MongoDBAdapter**: Implementa IDatabaseAdapter usando MongoDB
- **MongoDBAuthService**: Implementa IAuthService usando MongoDB com bcrypt

## 🏭 Service Factory

O Service Factory é responsável por instanciar os adapters corretos baseado na configuração do `.env`:

```typescript
import { getDatabaseAdapter, getAuthService } from '@/core/services/service-factory';

// Automaticamente usa Firebase ou MongoDB baseado no .env
const db = await getDatabaseAdapter();
const auth = await getAuthService();
```

## 💡 Vantagens da Arquitetura

### ✅ Flexibilidade
- Troque de banco sem alterar código
- Facilita testes com diferentes provedores
- Permite migração gradual entre tecnologias

### ✅ Manutenibilidade
- Código desacoplado e testável
- Cada adapter é independente
- Facilita adição de novos provedores

### ✅ Testabilidade
- Interfaces bem definidas permitem mocks fáceis
- Testes isolados por adapter
- Testes de integração simplificados

## 📝 Exemplos de Uso

### Exemplo 1: Usando Database Adapter
```typescript
import { getDatabaseAdapter } from '@/core/services/service-factory';

async function buscarDadosUsuario(userId: string) {
  const db = await getDatabaseAdapter();
  
  const user = await db.users.findById(userId);
  const transactions = await db.transactions.findByUserId(userId);
  const wallets = await db.wallets.findByUserId(userId);
  
  return { user, transactions, wallets };
}
```

### Exemplo 2: Usando Auth Service
```typescript
import { getAuthService } from '@/core/services/service-factory';

async function fazerLogin(email: string, password: string) {
  const auth = await getAuthService();
  
  const result = await auth.signIn({ email, password });
  
  if (result.success) {
    console.log('Login realizado:', result.user);
  } else {
    console.error('Erro no login:', result.error);
  }
}
```

### Exemplo 3: Transações Atômicas
```typescript
import { getDatabaseAdapter } from '@/core/services/service-factory';

async function transferirDinheiro(fromWallet: string, toWallet: string, amount: number) {
  const db = await getDatabaseAdapter();
  
  await db.withTransaction(async () => {
    await db.wallets.updateBalance(fromWallet, -amount);
    await db.wallets.updateBalance(toWallet, amount);
    
    await db.transactions.create({
      // ... dados da transação
    });
  });
}
```

## 🔧 Configuração

### Variáveis de Ambiente Principais

```env
# Tipo de banco (firebase ou mongodb)
DATABASE_TYPE=firebase

# Para Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json

# Para MongoDB  
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=finwise
```

### Arquivo de Exemplo
Veja `.env.example` para uma configuração completa.

## 🚀 Migração de Código Existente

Para migrar código existente:

1. **Substitua importações diretas**:
   ```typescript
   // ❌ Antes
   import { db } from '@/lib/firebase';
   
   // ✅ Depois  
   import { getDatabaseAdapter } from '@/core/services/service-factory';
   const db = await getDatabaseAdapter();
   ```

2. **Use os repositórios**:
   ```typescript
   // ❌ Antes
   await db.collection('users').doc(id).get();
   
   // ✅ Depois
   await db.users.findById(id);
   ```

3. **Atualize autenticação**:
   ```typescript
   // ❌ Antes
   import { auth } from '@/lib/firebase';
   
   // ✅ Depois
   import { getAuthService } from '@/core/services/service-factory';
   const auth = await getAuthService();
   ```

## 🧪 Testabilidade

A arquitetura facilita testes através de mocks:

```typescript
// Mock do database adapter para testes
const mockDb: IDatabaseAdapter = {
  users: {
    findById: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(createdUser),
    // ...
  },
  // ...
};
```

## 📚 Recursos Adicionais

- [Arquivo de exemplos completos](src/examples/hexagonal-architecture-usage.ts)
- [Documentação dos Ports](src/core/ports/)
- [Implementações dos Adapters](src/core/adapters/)

---

🎉 **Agora você pode alternar entre Firebase e MongoDB simplesmente mudando uma variável no .env!**
