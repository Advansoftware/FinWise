// src/core/adapters/mongodb/mongodb-installments.adapter.ts

import { Db, ObjectId } from 'mongodb';
import {
  IInstallmentsRepository,
  Installment,
  InstallmentPayment,
  CreateInstallmentInput,
  UpdateInstallmentInput,
  PayInstallmentInput,
  InstallmentSummary,
  GamificationData
} from '@/core/ports/installments.port';
import { addMonths, isAfter, isBefore, parseISO, format } from 'date-fns';

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
    const installmentAmount = installment.totalAmount / installment.totalInstallments;

    for (let i = 0; i < installment.totalInstallments; i++) {
      const dueDate = addMonths(startDate, i);

      payments.push({
        id: new ObjectId().toString(),
        installmentId: installment._id.toString(),
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString(),
        scheduledAmount: installmentAmount,
        status: 'pending'
      });
    }

    return payments;
  }

  async create(userId: string, data: CreateInstallmentInput): Promise<Installment> {
    const collection = this.db.collection('installments');

    const installmentAmount = data.totalAmount / data.totalInstallments;
    const now = new Date().toISOString();

    const installmentDoc: any = {
      _id: new ObjectId(),
      userId,
      ...data,
      installmentAmount,
      isActive: true,
      createdAt: now,
      updatedAt: now
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
    // Obter o client MongoDB a partir da conexão atual
    const client = (this.db as any).client;
    if (!client) {
      throw new Error('MongoDB client não disponível');
    }

    const session = client.startSession();

    try {
      return await session.withTransaction(async () => {
        const installmentsCollection = this.db.collection('installments');
        const transactionsCollection = this.db.collection('transactions');
        const walletsCollection = this.db.collection('wallets');

        // 1. Buscar o parcelamento
        const installment = await installmentsCollection.findOne({
          _id: new ObjectId(data.installmentId)
        }, { session });

        if (!installment) {
          throw new Error('Parcelamento não encontrado');
        }

        // 2. Buscar o pagamento específico
        const paymentIndex = installment.payments.findIndex((p: InstallmentPayment) =>
          p.installmentNumber === data.installmentNumber && p.status === 'pending'
        );

        if (paymentIndex === -1) {
          throw new Error('Parcela não encontrada ou já paga');
        }

        const payment = installment.payments[paymentIndex];

        // 3. Verificar se a carteira existe e tem saldo suficiente
        const wallet = await walletsCollection.findOne({
          _id: new ObjectId(installment.sourceWalletId)
        }, { session });

        if (!wallet) {
          throw new Error('Carteira não encontrada');
        }

        if (wallet.balance < data.paidAmount) {
          throw new Error('Saldo insuficiente na carteira');
        }

        // 4. Criar a transação
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

          const transactionResult = await transactionsCollection.insertOne(transactionData, { session });
          transactionId = transactionResult.insertedId.toString();
        }

        // 5. Debitar da carteira
        await walletsCollection.updateOne(
          { _id: new ObjectId(installment.sourceWalletId) },
          { $inc: { balance: -data.paidAmount } },
          { session }
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
          { returnDocument: 'after', session }
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
      });
    } finally {
      await session.endSession();
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

    return {
      points: Math.max(0, points),
      streak,
      badges,
      level,
      achievements,
      completionRate: 0, 
      financialHealthScore: 0,
      motivationalInsights: []
    };
  }

  private async calculatePaymentStreak(userId: string): Promise<number> {
    // ... (lógica existente para streak de parcelamentos)
    return 0; // Placeholder
  }

  private calculateLevel(points: number) {
    const levels = [
      { level: 1, name: 'Iniciante', pointsRequired: 0, benefits: [] },
      { level: 2, name: 'Organizador', pointsRequired: 100, benefits: [] },
      { level: 3, name: 'Planejador', pointsRequired: 300, benefits: [] },
      { level: 4, name: 'Estrategista', pointsRequired: 600, benefits: [] },
      { level: 5, name: 'Mestre', pointsRequired: 1000, benefits: [] },
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
      description: `Nível ${currentLevel.level}`,
      pointsRequired: currentLevel.pointsRequired,
      pointsToNext: Math.max(0, pointsToNext),
      benefits: currentLevel.benefits,
    };
  }

  private async calculateBadges(userId: string, installments: Installment[], goals: any[], budgets: any[]) {
    const badges = [];
    const now = new Date().toISOString();

    // Badges de Parcelamentos
    if (installments.some(inst => inst.paidInstallments > 0)) {
      badges.push({ id: 'first-payment', name: 'Primeiro Passo', description: 'Realizou seu primeiro pagamento de parcela', icon: '🎯', earnedAt: now, rarity: 'common' as const });
    }
    if (installments.filter(i => i.isCompleted).length >= 3) {
      badges.push({ id: 'finisher', name: 'Finalizador', description: 'Completou 3 parcelamentos', icon: '🏆', earnedAt: now, rarity: 'epic' as const });
    }

    // Badges de Metas
    if (goals.length > 0) {
      badges.push({ id: 'goal-setter', name: 'Sonhador', description: 'Criou sua primeira meta', icon: '✨', earnedAt: now, rarity: 'common' as const });
    }
    if (goals.some(g => g.currentAmount >= g.targetAmount)) {
      badges.push({ id: 'dream-achiever', name: 'Realizador de Sonhos', description: 'Alcançou sua primeira meta', icon: '🚀', earnedAt: now, rarity: 'rare' as const });
    }

    // Badges de Orçamentos
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
                amount: payment.scheduledAmount
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
}
