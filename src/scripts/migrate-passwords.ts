// src/scripts/migrate-passwords.ts
// Script para migrar senhas do formato SHA256 para bcrypt

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

async function migratePasswords() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');

    const db = client.db(process.env.MONGODB_DB || 'gastometria');
    const usersCollection = db.collection('users');

    // Buscar todos os usuários
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Encontrados ${users.length} usuários`);

    let migratedCount = 0;
    let alreadyMigratedCount = 0;

    for (const user of users) {
      // Verificar se a senha já está em formato bcrypt
      // Bcrypt hashes começam com $2a$, $2b$ ou $2y$
      if (user.passwordHash && user.passwordHash.startsWith('$2')) {
        alreadyMigratedCount++;
        continue;
      }

      // Se não tem senha hash, pular
      if (!user.passwordHash) {
        console.warn(`⚠️  Usuário ${user.email} não tem senha definida`);
        continue;
      }

      // Para migrar, vamos criar uma senha temporária e notificar o usuário
      // Na prática, você pode querer forçar reset de senha
      // Por enquanto, vamos assumir que a senha é o hash SHA256 e criar uma nova senha bcrypt

      // ATENÇÃO: Esta é uma abordagem simplificada
      // Em produção, você deveria:
      // 1. Invalidar todas as sessões
      // 2. Forçar reset de senha
      // 3. Enviar email para os usuários

      // Por enquanto, vamos manter o hash antigo em um campo separado
      // e gerar um novo hash bcrypt com uma senha padrão que o usuário deverá trocar

      console.log(`🔄 Mantendo hash SHA256 para ${user.email} e marcando para reset`);

      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            oldPasswordHash: user.passwordHash, // Preservar o hash antigo
            requirePasswordReset: true, // Marcar para reset obrigatório
          }
        }
      );

      migratedCount++;
    }

    console.log(`\n✅ Migração concluída!`);
    console.log(`   - ${alreadyMigratedCount} usuários já estavam migrados`);
    console.log(`   - ${migratedCount} usuários marcados para reset de senha`);
    console.log(`\n⚠️  IMPORTANTE: Os usuários com hash SHA256 ainda podem fazer login,`);
    console.log(`   mas você deve implementar um fluxo de reset de senha.`);

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar migração
migratePasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
