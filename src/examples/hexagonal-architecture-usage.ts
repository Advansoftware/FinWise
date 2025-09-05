// src/examples/hexagonal-architecture-usage.ts
// Este arquivo demonstra como usar a nova arquitetura hexagonal

import { getDatabaseAdapter, getAuthService, getDatabaseType } from '@/core/services/service-factory';

// Exemplo 1: Usando o Database Adapter
async function exemploUsoDatabaseAdapter() {
  console.log(`🔧 Tipo de banco configurado: ${getDatabaseType()}`);

  // Obtém o adapter de banco de dados (Firebase ou MongoDB baseado no .env)
  const db = await getDatabaseAdapter();

  // Agora você pode usar qualquer repositório independente do banco
  const users = await db.users.findById('123');
  const transactions = await db.transactions.findByUserId('123');
  const wallets = await db.wallets.findByUserId('123');

  console.log('Usuário:', users);
  console.log('Transações:', transactions.length);
  console.log('Carteiras:', wallets.length);
}

// Exemplo 2: Usando o Auth Service
async function exemploUsoAuthService() {
  const auth = await getAuthService();

  // Login funciona igual independente do provider (Firebase ou MongoDB)
  const loginResult = await auth.signIn({
    email: 'user@example.com',
    password: 'password123'
  });

  if (loginResult.success) {
    console.log('Login realizado com sucesso:', loginResult.user);

    // Obter usuário atual
    const currentUser = await auth.getCurrentUser();
    console.log('Usuário atual:', currentUser);
  } else {
    console.error('Erro no login:', loginResult.error);
  }
}

// Exemplo 3: Criando uma transação (independente do banco)
async function exemploCreateTransaction() {
  const db = await getDatabaseAdapter();

  const novaTransacao = await db.transactions.create({
    userId: '123',
    date: new Date().toISOString(),
    item: 'Compra de exemplo',
    category: 'Restaurante',
    subcategory: 'Almoço',
    amount: -25.50,
    quantity: 1,
    establishment: 'Restaurante do João',
    type: 'expense',
    walletId: 'wallet-123'
  });

  console.log('Transação criada:', novaTransacao);
}

// Exemplo 4: Usando transações de banco (para operações atômicas)
async function exemploTransacaoBanco() {
  const db = await getDatabaseAdapter();

  // Executa múltiplas operações de forma atômica
  await db.withTransaction(async () => {
    // Criar transação
    await db.transactions.create({
      userId: '123',
      date: new Date().toISOString(),
      item: 'Transferência',
      category: 'Transferência',
      subcategory: 'Entre contas',
      amount: -100,
      quantity: 1,
      establishment: 'Transferência interna',
      type: 'transfer',
      walletId: 'wallet-origem'
    });

    // Atualizar saldo da carteira de origem
    await db.wallets.updateBalance('wallet-origem', -100);

    // Atualizar saldo da carteira de destino
    await db.wallets.updateBalance('wallet-destino', 100);
  });

  console.log('Transferência realizada com sucesso!');
}

// Exemplo 5: Como alternar entre bancos via .env
/*
Para alternar entre Firebase e MongoDB, basta mudar a variável no .env:

=== Para usar Firebase ===
DATABASE_TYPE=firebase

=== Para usar MongoDB ===
DATABASE_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=finwise

Não é necessário alterar nenhum código da aplicação!
O service factory automaticamente carrega o adapter correto.
*/

export {
  exemploUsoDatabaseAdapter,
  exemploUsoAuthService,
  exemploCreateTransaction,
  exemploTransacaoBanco
};
