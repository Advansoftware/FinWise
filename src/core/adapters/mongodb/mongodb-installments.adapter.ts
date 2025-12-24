// src/core/adapters/mongodb/mongodb-installments.adapter.ts

import { Db, ObjectId } from 'mongodb';
import { IInstallmentsRepository, Installment, InstallmentPayment, CreateInstallmentInput, UpdateInstallmentInput, PayInstallmentInput, AdjustRecurringInstallmentInput, InstallmentSummary, GamificationData } from '@/core/ports/installments.port';
import { addMonths, addYears, isAfter, isBefore, parseISO, format } from 'date-fns';

export class MongoInstallmentsRepository implements IInstallmentsRepository {
  constructor(private db: Db) { }

  private calculateInstallmentFields(installment: any): Installment {
    const payments = installment.payments || [];
    const now = new Date();

    // Atualizar status de atraso automaticamente
    const updatedPayments = payments.map((p: InstallmentPayment) => {
      if (p.status === 'pending') {
        const dueDate = parseISO(p.dueDate);
        if (isBefore(dueDate, now)) {
          return { ...p, status: 'overdue' as const };
        }
      }
      return p;
    });

    const paidPayments = updatedPayments.filter((p: InstallmentPayment) => p.status === 'paid');
    const overduePayments = updatedPayments.filter((p: InstallmentPayment) => p.status === 'overdue');

    const paidInstallments = paidPayments.length;
    const remainingInstallments = installment.totalInstallments - paidInstallments;
    const totalPaid = paidPayments.reduce((sum: number, p: InstallmentPayment) => sum + (p.paidAmount || 0), 0);
    const remainingAmount = installment.totalAmount - totalPaid;
    const isCompleted = remainingInstallments <= 0;

    // Encontrar próxima data de vencimento
    let nextDueDate: string | undefined;
    if (!isCompleted) {
      const pendingPayments = updatedPayments.filter((p: InstallmentPayment) => p.status === 'pending');
      if (pendingPayments.length > 0) {
        pendingPayments.sort((a: InstallmentPayment, b: InstallmentPayment) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        nextDueDate = pendingPayments[0].dueDate;
      } else if (overduePayments.length > 0) {
        // Se não há pendentes, mas há em atraso, mostrar a mais antiga em atraso
        overduePayments.sort((a: InstallmentPayment, b: InstallmentPayment) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        nextDueDate = overduePayments[0].dueDate;
      }
    }

    return {
      ...installment,
      id: installment._id.toString(),
      paidInstallments,
      remainingInstallments,
      totalPaid,
      remainingAmount,
      isCompleted,
      nextDueDate,
      payments: updatedPayments.map((p: any) => ({
        ...p,
        id: p._id ? p._id.toString() : p.id
      }))
    };
  }

  private generateInstallmentPayments(installment: CreateInstallmentInput & { _id: ObjectId }): InstallmentPayment[] {
    const payments: InstallmentPayment[] = [];
    const startDate = parseISO(installment.startDate);

    // Para parcelamentos recorrentes, usar o valor total como valor de cada parcela
    // Para normais, dividir pelo número de parcelas
    const defaultInstallmentAmount = installment.isRecurring
      ? installment.totalAmount
      : installment.totalAmount / installment.totalInstallments;

    // Se é recorrente, gerar apenas alguns pagamentos futuros (próximos 24 meses para mensal, 5 anos para anual)
    const totalToGenerate = installment.isRecurring
      ? (installment.recurringType === 'yearly' ? 5 : 24)
      : installment.totalInstallments;

    const intervalUnit = installment.isRecurring && installment.recurringType === 'yearly' ? 'year' : 'month';

    // Verificar se há valores customizados e se o array tem o tamanho correto
    const hasCustomAmounts = installment.customInstallmentAmounts &&
      installment.customInstallmentAmounts.length === installment.totalInstallments &&
      !installment.isRecurring;

    for (let i = 0; i < totalToGenerate; i++) {
      const dueDate = intervalUnit === 'year'
        ? addYears(startDate, i)
        : addMonths(startDate, i);

      // Se há data de fim definida para recorrente, não gerar após essa data
      if (installment.isRecurring && installment.endDate) {
        const endDate = parseISO(installment.endDate);
        if (dueDate > endDate) break;
      }

      // Usar valor customizado se disponível, senão usar valor padrão
      const scheduledAmount = hasCustomAmounts && installment.customInstallmentAmounts![i] !== undefined
        ? installment.customInstallmentAmounts![i]
        : defaultInstallmentAmount;

      payments.push({
        id: new ObjectId().toString(),
        installmentId: installment._id.toString(),
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString(),
        scheduledAmount,
        status: 'pending'
      });
    }

    return payments;
  }

  async create(userId: string, data: CreateInstallmentInput): Promise<Installment> {
    const collection = this.db.collection('installments');

    // Para parcelamentos recorrentes, o installmentAmount é o valor total
    // Para normais, é o valor total dividido pelo número de parcelas
    const installmentAmount = data.isRecurring
      ? data.totalAmount
      : data.totalAmount / data.totalInstallments;

    const now = new Date().toISOString();

    const installmentDoc: any = {
      _id: new ObjectId(),
      userId,
      ...data,
      installmentAmount,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      // Inicializar histórico de ajustes para recorrentes
      adjustmentHistory: data.isRecurring ? [] : undefined
    };

    // Gerar pagamentos automaticamente
    const payments = this.generateInstallmentPayments(installmentDoc);
    installmentDoc.payments = payments;

    await collection.insertOne(installmentDoc);

    return this.calculateInstallmentFields(installmentDoc);
  }

  async findById(id: string): Promise<Installment | null> {
    const collection = this.db.collection('installments');
    const installment = await collection.findOne({ _id: new ObjectId(id) });

    return installment ? this.calculateInstallmentFields(installment) : null;
  }

  async findByUserId(userId: string): Promise<Installment[]> {
    const collection = this.db.collection('installments');
    const installments = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();

    return installments.map(installment => this.calculateInstallmentFields(installment));
  }

  async update(id: string, data: UpdateInstallmentInput): Promise<Installment | null> {
    const collection = this.db.collection('installments');

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result ? this.calculateInstallmentFields(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const collection = this.db.collection('installments');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    return result.deletedCount === 1;
  }

  async payInstallment(data: PayInstallmentInput): Promise<InstallmentPayment | null> {
    try {
      const installmentsCollection = this.db.collection('installments');
      const transactionsCollection = this.db.collection('transactions');
      const walletsCollection = this.db.collection('wallets');

      // 1. Buscar o parcelamento
      const installment = await installmentsCollection.findOne({
        _id: new ObjectId(data.installmentId)
      });

      if (!installment) {
        throw new Error('Parcelamento não encontrado');
      }

      console.log('📦 Parcelamento encontrado:', {
        id: installment._id.toString(),
        sourceWalletId: installment.sourceWalletId,
        userId: installment.userId,
        name: installment.name
      });

      // 2. Buscar o pagamento específico
      const paymentIndex = installment.payments.findIndex((p: InstallmentPayment) =>
        p.installmentNumber === data.installmentNumber && p.status === 'pending'
      );

      if (paymentIndex === -1) {
        throw new Error('Parcela não encontrada ou já paga');
      }

      const payment = installment.payments[paymentIndex];

      // Debug: Listar TODAS as carteiras do usuário, incluindo possíveis duplicatas
      const allUserWallets = await walletsCollection.find({ userId: installment.userId }).toArray();
      console.log('💳 TODAS as carteiras do usuário no MongoDB:');
      allUserWallets.forEach((w, index) => {
        console.log(`  ${index + 1}. ID: ${w._id.toString()} | Nome: "${w.name}" | Saldo: R$ ${w.balance}`);
      });

      // Verificar se há carteiras com nome similar
      const nubankWallets = allUserWallets.filter(w =>
        (w.name || '').toLowerCase().includes('nubank') ||
        (w.name || '').toLowerCase().includes('nu bank')
      );
      console.log('🏦 Carteiras "Nubank" encontradas:', nubankWallets.length);
      nubankWallets.forEach((w, index) => {
        console.log(`  Nubank ${index + 1}: ID: ${w._id.toString()} | Nome exato: "${w.name}"`);
      });

      // 3. Verificar se a carteira existe e tem saldo suficiente
      console.log('🔍 Buscando carteira do parcelamento ID:', installment.sourceWalletId);
      let wallet = await walletsCollection.findOne({
        _id: new ObjectId(installment.sourceWalletId)
      });

      // Se a carteira original não existe, buscar uma carteira disponível do usuário
      if (!wallet) {
        console.log('🔄 Carteira original não encontrada, buscando carteira disponível para o usuário');
        wallet = await walletsCollection.findOne({ userId: installment.userId });

        if (wallet) {
          console.log('✅ Usando carteira disponível:', wallet.name, 'ID:', wallet._id.toString());
          console.log('🔧 Atualizando parcelamento para corrigir referência órfã...');

          // Atualizar o parcelamento para usar a carteira correta
          await installmentsCollection.updateOne(
            { _id: new ObjectId(data.installmentId) },
            { $set: { sourceWalletId: wallet._id.toString() } }
          );

          console.log('✅ Parcelamento corrigido com sucesso!');

          // IMPORTANTE: Também atualizar todas as outras transações que possam estar com a carteira órfã
          const orphanedTransactions = await transactionsCollection.countDocuments({
            userId: installment.userId,
            walletId: installment.sourceWalletId
          });

          if (orphanedTransactions > 0) {
            console.log(`🔧 Encontradas ${orphanedTransactions} transações órfãs, corrigindo...`);
            await transactionsCollection.updateMany(
              {
                userId: installment.userId,
                walletId: installment.sourceWalletId
              },
              { $set: { walletId: wallet._id.toString() } }
            );
            console.log('✅ Transações órfãs corrigidas!');
          }
        }
      } if (!wallet) {
        throw new Error('Carteira não encontrada');
      }

      if (wallet.balance < data.paidAmount) {
        throw new Error('Saldo insuficiente na carteira');
      }

      // 4. Criar a transação se não foi fornecida
      let transactionId = data.transactionId;
      if (!transactionId) {
        const transactionData = {
          userId: installment.userId,
          date: data.paidDate,
          item: `${installment.name} - Parcela ${data.installmentNumber}/${installment.totalInstallments}`,
          category: installment.category as any,
          subcategory: installment.subcategory,
          amount: data.paidAmount,
          quantity: 1,
          establishment: installment.establishment,
          type: 'expense' as const,
          walletId: installment.sourceWalletId
        };

        const transactionResult = await transactionsCollection.insertOne(transactionData);
        transactionId = transactionResult.insertedId.toString();
      }

      // 5. Debitar da carteira
      await walletsCollection.updateOne(
        { _id: new ObjectId(installment.sourceWalletId) },
        { $inc: { balance: -data.paidAmount } }
      );

      // 6. Atualizar o pagamento no parcelamento
      const updateResult = await installmentsCollection.findOneAndUpdate(
        {
          _id: new ObjectId(data.installmentId),
          'payments.installmentNumber': data.installmentNumber
        },
        {
          $set: {
            'payments.$.paidAmount': data.paidAmount,
            'payments.$.paidDate': data.paidDate,
            'payments.$.status': 'paid',
            'payments.$.transactionId': transactionId,
            updatedAt: new Date().toISOString()
          }
        },
        { returnDocument: 'after' }
      );

      if (!updateResult) {
        throw new Error('Falha ao atualizar o pagamento');
      }

      const updatedPayment = updateResult.payments.find((p: InstallmentPayment) =>
        p.installmentNumber === data.installmentNumber
      );

      return updatedPayment ? {
        ...updatedPayment,
        id: updatedPayment.id || updatedPayment._id?.toString()
      } : null;

    } catch (error) {
      console.error('Error in payInstallment:', error);
      throw error;
    }
  }

  async getInstallmentPayments(installmentId: string): Promise<InstallmentPayment[]> {
    const installment = await this.findById(installmentId);
    return installment?.payments || [];
  }

  async findActiveInstallments(userId: string): Promise<Installment[]> {
    const collection = this.db.collection('installments');
    const installments = await collection.find({
      userId,
      isActive: true
    }).sort({ createdAt: -1 }).toArray();

    return installments
      .map(installment => this.calculateInstallmentFields(installment))
      .filter(installment => !installment.isCompleted);
  }

  async findUpcomingPayments(userId: string, days: number = 30): Promise<InstallmentPayment[]> {
    const installments = await this.findActiveInstallments(userId);
    const now = new Date();
    const futureDate = addMonths(now, Math.ceil(days / 30));

    const upcomingPayments: InstallmentPayment[] = [];

    installments.forEach(installment => {
      installment.payments.forEach(payment => {
        if (payment.status === 'pending') {
          const dueDate = parseISO(payment.dueDate);
          if (isAfter(dueDate, now) && isBefore(dueDate, futureDate)) {
            upcomingPayments.push(payment);
          }
        }
      });
    });

    return upcomingPayments.sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  async findOverduePayments(userId: string): Promise<InstallmentPayment[]> {
    const installments = await this.findActiveInstallments(userId);

    const overduePayments: InstallmentPayment[] = [];

    installments.forEach(installment => {
      installment.payments.forEach(payment => {
        if (payment.status === 'overdue') {
          overduePayments.push(payment);
        }
      });
    });

    return overduePayments.sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  async getInstallmentSummary(userId: string): Promise<InstallmentSummary | null> {
    const installments = await this.findByUserId(userId);
    const activeInstallments = installments.filter(i => i.isActive && !i.isCompleted);
    const upcomingPayments = await this.findUpcomingPayments(userId, 30);
    const overduePayments = await this.findOverduePayments(userId);

    if (installments.length === 0) return null;

    const totalMonthlyCommitment = activeInstallments.reduce((sum, installment) =>
      sum + installment.installmentAmount, 0
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let completedThisMonth = 0;
    activeInstallments.forEach(installment => {
      installment.payments.forEach(payment => {
        if (payment.status === 'paid' && payment.paidDate) {
          const paidDate = parseISO(payment.paidDate);
          if (paidDate >= startOfMonth && paidDate <= endOfMonth) {
            completedThisMonth++;
          }
        }
      });
    });

    const projectedCompletionDates = activeInstallments.map(installment => {
      const lastPayment = installment.payments
        .filter(p => p.status === 'pending')
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];

      return {
        installmentId: installment.id,
        name: installment.name,
        projectedDate: lastPayment?.dueDate || installment.startDate
      };
    });

    const gamification = await this.calculateGamification(userId, installments);

    return {
      totalActiveInstallments: activeInstallments.length,
      totalMonthlyCommitment,
      upcomingPayments,
      overduePayments,
      completedThisMonth,
      projectedCompletionDates,
      gamification
    };
  }

  private async calculateGamification(userId: string, allUserInstallments: Installment[]): Promise<GamificationData> {
    const goals = await this.db.collection('goals').find({ userId }).toArray();
    const budgets = await this.db.collection('budgets').find({ userId }).toArray();

    // --- Pontos ---
    let points = 0;
    // Pontos de Parcelamentos
    const paidInstallmentsCount = allUserInstallments.reduce((sum, inst) => sum + inst.paidInstallments, 0);
    points += paidInstallmentsCount * 10;
    const completedInstallmentsCount = allUserInstallments.filter(i => i.isCompleted).length;
    points += completedInstallmentsCount * 50;

    // Pontos de Metas
    const completedGoalsCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;
    points += goals.length * 5; // por criar
    points += completedGoalsCount * 100; // por completar

    // Pontos de Orçamentos
    points += budgets.length * 10; // por criar

    // --- Streak ---
    const streak = await this.calculatePaymentStreak(userId);

    // --- Badges ---
    const badges = await this.calculateBadges(userId, allUserInstallments, goals, budgets);

    // --- Nível ---
    const level = this.calculateLevel(points);

    // --- Conquistas ---
    const achievements = await this.calculateAchievements(userId, allUserInstallments, goals, budgets);

    // --- Taxa de conclusão ---
    const totalPayments = allUserInstallments.reduce((sum, inst) => sum + inst.totalInstallments, 0);
    const paidPayments = allUserInstallments.reduce((sum, inst) => sum + inst.paidInstallments, 0);
    const completionRate = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0;

    return {
      points: Math.max(0, points),
      streak,
      badges,
      level,
      achievements,
      completionRate,
      financialHealthScore: 0,
      motivationalInsights: []
    };
  }

  private async calculatePaymentStreak(userId: string): Promise<number> {
    const now = new Date();
    let streak = 0;
    let currentDate = new Date(now.getFullYear(), now.getMonth(), 1); // Início do mês atual

    // Verifica os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const monthlyPayments = await this.db.collection('installments').aggregate([
        { $match: { userId } },
        { $unwind: '$payments' },
        {
          $match: {
            'payments.status': 'paid',
            'payments.paidDate': {
              $gte: startOfMonth.toISOString(),
              $lte: endOfMonth.toISOString()
            }
          }
        },
        { $count: 'totalPayments' }
      ]).toArray();

      const hasPaymentsThisMonth = monthlyPayments.length > 0 && monthlyPayments[0].totalPayments > 0;

      if (hasPaymentsThisMonth) {
        streak++;
      } else {
        break; // Quebra a sequência se não houve pagamentos no mês
      }

      // Volta um mês
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    }

    return streak;
  }

  private calculateLevel(points: number) {
    // Níveis expandidos de 1 a 10 com progressão exponencial
    const levels = [
      { level: 1, name: 'Iniciante', pointsRequired: 0, benefits: ['Acesso ao sistema básico', 'Controle de transações'] },
      { level: 2, name: 'Organizador', pointsRequired: 100, benefits: ['Relatórios mensais', 'Notificações de vencimento'] },
      { level: 3, name: 'Disciplinado', pointsRequired: 300, benefits: ['Insights de gastos', 'Dashboard expandido'] },
      { level: 4, name: 'Estrategista', pointsRequired: 600, benefits: ['Projeções financeiras', 'Metas avançadas'] },
      { level: 5, name: 'Expert', pointsRequired: 1000, benefits: ['Análise por IA', 'Recomendações personalizadas'] },
      { level: 6, name: 'Veterano', pointsRequired: 1500, benefits: ['Relatórios detalhados', 'Exportação de dados'] },
      { level: 7, name: 'Elite', pointsRequired: 2200, benefits: ['Acesso antecipado', 'Recursos beta'] },
      { level: 8, name: 'Mestre', pointsRequired: 3000, benefits: ['Suporte prioritário', 'Consultoria IA'] },
      { level: 9, name: 'Grão-Mestre', pointsRequired: 4000, benefits: ['Funcionalidades exclusivas', 'Badge especial'] },
      { level: 10, name: 'Lenda', pointsRequired: 5500, benefits: ['Status Lenda', 'Todas as funcionalidades'] },
    ];

    let currentLevel = levels[0];
    for (const level of levels) {
      if (points >= level.pointsRequired) {
        currentLevel = level;
      }
    }
    const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
    const pointsToNext = nextLevel ? nextLevel.pointsRequired - points : 0;

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      description: `Nível ${currentLevel.level} - ${currentLevel.name}`,
      pointsRequired: currentLevel.pointsRequired,
      pointsToNext: Math.max(0, pointsToNext),
      benefits: currentLevel.benefits,
    };
  }

  private async calculateBadges(userId: string, installments: Installment[], goals: any[], budgets: any[]) {
    const badges = [];
    const now = new Date().toISOString();

    // Contadores para badges
    const paidInstallmentsCount = installments.reduce((sum, inst) => sum + inst.paidInstallments, 0);
    const completedInstallmentsCount = installments.filter(i => i.isCompleted).length;
    const completedGoalsCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;
    const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

    // === Badges de Onboarding ===
    if (installments.some(inst => inst.paidInstallments > 0)) {
      badges.push({ id: 'first-payment', name: 'Pagador', description: 'Pagou sua primeira parcela', icon: '💳', earnedAt: now, rarity: 'common' as const });
    }

    // === Badges de Pagamentos ===
    if (paidInstallmentsCount >= 10) {
      badges.push({ id: 'punctual-10', name: 'Pontual', description: '10 pagamentos em dia', icon: '⏰', earnedAt: now, rarity: 'rare' as const });
    }
    if (paidInstallmentsCount >= 50) {
      badges.push({ id: 'punctual-50', name: 'Super Pontual', description: '50 pagamentos em dia', icon: '⏱️', earnedAt: now, rarity: 'epic' as const });
    }
    if (paidInstallmentsCount >= 100) {
      badges.push({ id: 'punctual-100', name: 'Mestre da Pontualidade', description: '100 pagamentos em dia', icon: '🕐', earnedAt: now, rarity: 'legendary' as const });
    }

    // === Badges de Parcelamentos ===
    if (completedInstallmentsCount >= 1) {
      badges.push({ id: 'installment-complete-1', name: 'Finalizador', description: 'Completou 1 parcelamento', icon: '🏁', earnedAt: now, rarity: 'common' as const });
    }
    if (completedInstallmentsCount >= 5) {
      badges.push({ id: 'installment-complete-5', name: 'Quitador', description: 'Completou 5 parcelamentos', icon: '🎖️', earnedAt: now, rarity: 'rare' as const });
    }
    if (completedInstallmentsCount >= 15) {
      badges.push({ id: 'installment-complete-15', name: 'Livre de Dívidas', description: 'Completou 15 parcelamentos', icon: '🏆', earnedAt: now, rarity: 'epic' as const });
    }
    if (completedInstallmentsCount >= 30) {
      badges.push({ id: 'installment-complete-30', name: 'Destruidor de Dívidas', description: 'Completou 30 parcelamentos', icon: '💪', earnedAt: now, rarity: 'legendary' as const });
    }

    // === Badges de Metas ===
    if (goals.length > 0) {
      badges.push({ id: 'goal-setter', name: 'Sonhador', description: 'Definiu sua primeira meta', icon: '🎯', earnedAt: now, rarity: 'common' as const });
    }
    if (completedGoalsCount >= 1) {
      badges.push({ id: 'goal-complete-1', name: 'Realizador', description: 'Completou 1 meta', icon: '🌟', earnedAt: now, rarity: 'common' as const });
    }
    if (completedGoalsCount >= 5) {
      badges.push({ id: 'goal-complete-5', name: 'Conquistador', description: 'Completou 5 metas', icon: '⭐', earnedAt: now, rarity: 'rare' as const });
    }
    if (completedGoalsCount >= 10) {
      badges.push({ id: 'goal-complete-10', name: 'Campeão de Metas', description: 'Completou 10 metas', icon: '🏅', earnedAt: now, rarity: 'epic' as const });
    }

    // === Badges de Economia ===
    if (totalSaved >= 1000) {
      badges.push({ id: 'goal-1000', name: 'Poupador Bronze', description: 'Economizou R$ 1.000', icon: '🥉', earnedAt: now, rarity: 'common' as const });
    }
    if (totalSaved >= 5000) {
      badges.push({ id: 'goal-5000', name: 'Poupador Prata', description: 'Economizou R$ 5.000', icon: '🥈', earnedAt: now, rarity: 'rare' as const });
    }
    if (totalSaved >= 10000) {
      badges.push({ id: 'goal-10000', name: 'Poupador Ouro', description: 'Economizou R$ 10.000', icon: '🥇', earnedAt: now, rarity: 'epic' as const });
    }
    if (totalSaved >= 50000) {
      badges.push({ id: 'goal-50000', name: 'Poupador Diamante', description: 'Economizou R$ 50.000', icon: '💎', earnedAt: now, rarity: 'legendary' as const });
    }

    // === Badges de Orçamentos ===
    if (budgets.length >= 1) {
      badges.push({ id: 'budget-starter', name: 'Planejador Iniciante', description: 'Criou seu primeiro orçamento', icon: '📋', earnedAt: now, rarity: 'common' as const });
    }
    if (budgets.length >= 3) {
      badges.push({ id: 'budget-master', name: 'Mestre dos Orçamentos', description: 'Criou 3 ou mais orçamentos', icon: '📊', earnedAt: now, rarity: 'rare' as const });
    }

    return badges;
  }

  private async calculateAchievements(userId: string, installments: Installment[], goals: any[], budgets: any[]) {
    const achievements = [];
    const now = new Date().toISOString();

    // Conquistas de Parcelamentos
    const paidInstallments = installments.reduce((sum, inst) => sum + inst.paidInstallments, 0);
    achievements.push({
      id: 'punctuality-master', name: 'Mestre da Pontualidade', description: 'Pague 50 parcelas em dia',
      icon: '⚡', progress: paidInstallments, target: 50, isCompleted: paidInstallments >= 50, points: 200, completedAt: paidInstallments >= 50 ? now : undefined
    });

    // Conquistas de Metas
    const completedGoalsCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;
    achievements.push({
      id: 'serial-achiever', name: 'Conquistador em Série', description: 'Complete 5 metas financeiras',
      icon: '👑', progress: completedGoalsCount, target: 5, isCompleted: completedGoalsCount >= 5, points: 300, completedAt: completedGoalsCount >= 5 ? now : undefined
    });

    // Conquistas de Orçamentos
    const totalBudgets = budgets.length;
    achievements.push({
      id: 'budget-expert', name: 'Expert em Orçamentos', description: 'Crie 10 orçamentos diferentes',
      icon: '📈', progress: totalBudgets, target: 10, isCompleted: totalBudgets >= 10, points: 150, completedAt: totalBudgets >= 10 ? now : undefined
    });

    // Placeholder para conquistas que precisam de mais lógica
    achievements.push({
      id: 'overspending-avoider', name: 'Mestre do Controle', description: 'Passe um mês inteiro sem estourar nenhum orçamento',
      icon: '🛡️', progress: 0, target: 1, isCompleted: false, points: 100
    });


    return achievements;
  }

  async projectMonthlyCommitments(userId: string, months: number): Promise<Array<{
    month: string;
    totalCommitment: number;
    installments: Array<{
      installmentId: string;
      name: string;
      amount: number;
      isRecurring?: boolean;
    }>;
  }>> {
    const activeInstallments = await this.findActiveInstallments(userId);
    const now = new Date();
    const projections = [];

    for (let i = 0; i < months; i++) {
      const targetMonth = addMonths(now, i);
      const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

      let totalCommitment = 0;
      const installmentsInMonth: Array<{
        installmentId: string;
        name: string;
        amount: number;
        isRecurring?: boolean;
      }> = [];

      activeInstallments.forEach(installment => {
        installment.payments.forEach(payment => {
          if (payment.status === 'pending') {
            const dueDate = parseISO(payment.dueDate);
            if (dueDate >= monthStart && dueDate <= monthEnd) {
              totalCommitment += payment.scheduledAmount;
              installmentsInMonth.push({
                installmentId: installment.id,
                name: installment.name,
                amount: payment.scheduledAmount,
                isRecurring: installment.isRecurring || false
              });
            }
          }
        });
      });

      projections.push({
        month: format(targetMonth, 'yyyy-MM'),
        totalCommitment,
        installments: installmentsInMonth
      });
    }

    return projections;
  }

  /**
   * Migra todos os parcelamentos e transações órfãos para usar carteiras válidas
   */
  async migrateOrphanedWalletReferences(userId: string): Promise<{
    installmentsMigrated: number,
    transactionsMigrated: number
  }> {
    const installmentsCollection = this.db.collection('installments');
    const transactionsCollection = this.db.collection('transactions');
    const walletsCollection = this.db.collection('wallets');

    console.log('🔧 Iniciando migração de dados órfãos para usuário:', userId);

    // Buscar carteira válida do usuário
    const validWallet = await walletsCollection.findOne({ userId });
    if (!validWallet) {
      throw new Error('Nenhuma carteira válida encontrada para o usuário');
    }

    console.log('✅ Carteira válida encontrada:', validWallet.name, 'ID:', validWallet._id.toString());

    // Buscar todos os IDs de carteiras válidas do usuário
    const validWalletIds = await walletsCollection
      .find({ userId })
      .project({ _id: 1 })
      .toArray()
      .then(wallets => wallets.map(w => w._id.toString()));

    console.log('📝 IDs de carteiras válidas:', validWalletIds);

    // Migrar parcelamentos órfãos
    const orphanedInstallments = await installmentsCollection.find({
      userId,
      sourceWalletId: { $nin: validWalletIds }
    }).toArray();

    let installmentsMigrated = 0;
    for (const installment of orphanedInstallments) {
      await installmentsCollection.updateOne(
        { _id: installment._id },
        { $set: { sourceWalletId: validWallet._id.toString() } }
      );
      installmentsMigrated++;
    }

    // Migrar transações órfãs
    const orphanedTransactionsResult = await transactionsCollection.updateMany(
      {
        userId,
        walletId: { $nin: validWalletIds }
      },
      { $set: { walletId: validWallet._id.toString() } }
    );

    const transactionsMigrated = orphanedTransactionsResult.modifiedCount;

    console.log(`✅ Migração concluída: ${installmentsMigrated} parcelamentos e ${transactionsMigrated} transações migradas`);

    return { installmentsMigrated, transactionsMigrated };
  }

  // Métodos para parcelamentos recorrentes
  async adjustRecurringInstallment(data: AdjustRecurringInstallmentInput): Promise<boolean> {
    const collection = this.db.collection('installments');

    try {
      const installment = await collection.findOne({ _id: new ObjectId(data.installmentId) });
      if (!installment || !installment.isRecurring) {
        return false;
      }

      const now = new Date().toISOString();

      // Adicionar à história de ajustes
      const adjustmentRecord = {
        date: now,
        previousAmount: installment.installmentAmount,
        newAmount: data.newAmount,
        reason: data.reason || 'Ajuste de valor'
      };

      const currentHistory = installment.adjustmentHistory || [];

      // Atualizar o parcelamento
      await collection.updateOne(
        { _id: new ObjectId(data.installmentId) },
        {
          $set: {
            installmentAmount: data.newAmount,
            totalAmount: data.newAmount, // Para recorrentes, totalAmount = installmentAmount
            updatedAt: now,
            adjustmentHistory: [...currentHistory, adjustmentRecord]
          }
        }
      );

      // Atualizar pagamentos futuros com o novo valor
      const effectiveDate = parseISO(data.effectiveDate);
      await collection.updateMany(
        {
          'payments.installmentId': data.installmentId,
          'payments.dueDate': { $gte: effectiveDate.toISOString() },
          'payments.status': 'pending'
        },
        {
          $set: {
            'payments.$.scheduledAmount': data.newAmount
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error adjusting recurring installment:', error);
      return false;
    }
  }

  async findRecurringInstallments(userId: string): Promise<Installment[]> {
    const collection = this.db.collection('installments');
    const installments = await collection
      .find({
        userId,
        isRecurring: true,
        isActive: true
      })
      .sort({ createdAt: -1 })
      .toArray();

    return installments.map(installment => this.calculateInstallmentFields(installment));
  }

  async findFixedInstallments(userId: string): Promise<Installment[]> {
    const collection = this.db.collection('installments');
    const installments = await collection
      .find({
        userId,
        $or: [
          { isRecurring: { $ne: true } },
          { isRecurring: { $exists: false } }
        ],
        isActive: true
      })
      .sort({ createdAt: -1 })
      .toArray();

    return installments.map(installment => this.calculateInstallmentFields(installment));
  }
}
