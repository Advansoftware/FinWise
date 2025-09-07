// src/core/adapters/mongodb/mongodb-installments.adapter.ts

import { Db, ObjectId } from 'mongodb';
import {
  IInstallmentsRepository,
  Installment,
  InstallmentPayment,
  CreateInstallmentInput,
  UpdateInstallmentInput,
  PayInstallmentInput,
  InstallmentSummary
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
    const isCompleted = remainingInstallments === 0;

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

  async getInstallmentSummary(userId: string): Promise<InstallmentSummary> {
    const activeInstallments = await this.findActiveInstallments(userId);
    const upcomingPayments = await this.findUpcomingPayments(userId, 30);
    const overduePayments = await this.findOverduePayments(userId);

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

    // Calcular gamificação real
    const gamification = await this.calculateGamification(userId, activeInstallments);

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

  private async calculateGamification(userId: string, installments: Installment[]) {
    // Calcular estatísticas gerais
    const totalPayments = installments.reduce((sum, inst) => sum + inst.totalInstallments, 0);
    const paidPayments = installments.reduce((sum, inst) => sum + inst.paidInstallments, 0);
    const completionRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

    // Calcular streak (sequência de pagamentos em dia)
    const streak = await this.calculatePaymentStreak(userId);

    // Calcular pontos baseados em atividade
    const points = await this.calculatePoints(userId, installments);

    // Determinar nível baseado em pontos
    const level = this.calculateLevel(points);

    // Buscar badges conquistados
    const badges = await this.calculateBadges(userId, installments);

    // Calcular achievements
    const achievements = await this.calculateAchievements(userId, installments);

    return {
      completionRate,
      streak,
      badges,
      points,
      level,
      achievements
    };
  }

  private async calculatePaymentStreak(userId: string): Promise<number> {
    const collection = this.db.collection('installments');
    const installments = await collection.find({ userId, isActive: true }).toArray();

    let streak = 0;
    let currentDate = new Date();

    // Verificar quantos meses consecutivos o usuário pagou todas as parcelas em dia
    for (let i = 0; i < 12; i++) { // Verificar últimos 12 meses
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

      let allPaidOnTime = true;

      for (const installment of installments) {
        const monthPayments = installment.payments.filter((p: any) => {
          const dueDate = parseISO(p.dueDate);
          return dueDate >= monthStart && dueDate <= monthEnd;
        });

        for (const payment of monthPayments) {
          if (payment.status === 'paid' && payment.paidDate) {
            const paidDate = parseISO(payment.paidDate);
            const dueDate = parseISO(payment.dueDate);
            if (paidDate > dueDate) {
              allPaidOnTime = false;
              break;
            }
          } else if (payment.status !== 'paid' && parseISO(payment.dueDate) < new Date()) {
            allPaidOnTime = false;
            break;
          }
        }

        if (!allPaidOnTime) break;
      }

      if (allPaidOnTime && installments.some(inst =>
        inst.payments.some((p: any) => {
          const dueDate = parseISO(p.dueDate);
          return dueDate >= monthStart && dueDate <= monthEnd;
        })
      )) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async calculatePoints(userId: string, installments: Installment[]): Promise<number> {
    let points = 0;

    // Pontos por parcelas pagas
    const paidPayments = installments.reduce((sum, inst) => sum + inst.paidInstallments, 0);
    points += paidPayments * 10;

    // Bonificação por pagamentos em dia e penalidades por atraso
    for (const installment of installments) {
      for (const payment of installment.payments) {
        if (payment.status === 'paid' && payment.paidDate) {
          const paidDate = parseISO(payment.paidDate);
          const dueDate = parseISO(payment.dueDate);
          if (paidDate <= dueDate) {
            points += 5; // Bonus por pagar em dia
          } else {
            // Penalidade por pagar com atraso
            const daysLate = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            points -= Math.min(daysLate * 2, 20); // Máximo de 20 pontos de penalidade
          }
        } else if (payment.status === 'overdue') {
          // Penalidade por parcelas ainda em atraso
          const dueDate = parseISO(payment.dueDate);
          const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          points -= Math.min(daysOverdue * 1, 30); // Máximo de 30 pontos de penalidade por parcela
        }
      }
    }

    // Bonificação por completar parcelamentos
    const completedInstallments = installments.filter(inst => inst.isCompleted);
    points += completedInstallments.length * 50;

    // Garantir que pontos não sejam negativos
    return Math.max(0, points);
  }

  private calculateLevel(points: number) {
    const levels = [
      { level: 1, name: 'Iniciante', pointsRequired: 0, benefits: ['Controle básico de parcelamentos'] },
      { level: 2, name: 'Organizador', pointsRequired: 100, benefits: ['Relatórios mensais', 'Notificações avançadas'] },
      { level: 3, name: 'Disciplinado', pointsRequired: 300, benefits: ['Projeções automáticas', 'Análise de tendências'] },
      { level: 4, name: 'Expert', pointsRequired: 600, benefits: ['Otimização automática', 'Consultoria IA'] },
      { level: 5, name: 'Mestre', pointsRequired: 1000, benefits: ['Recursos premium', 'Suporte prioritário'] }
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
      benefits: currentLevel.benefits
    };
  }

  private async calculateBadges(userId: string, installments: Installment[]) {
    const badges = [];
    const now = new Date();

    // Badge: Primeiro pagamento
    const hasAnyPayment = installments.some(inst => inst.paidInstallments > 0);
    if (hasAnyPayment) {
      badges.push({
        id: 'first-payment',
        name: 'Primeiro Passo',
        description: 'Realizou seu primeiro pagamento de parcela',
        icon: '🎯',
        earnedAt: now.toISOString(),
        rarity: 'common' as const
      });
    }

    // Badge: Pagador pontual
    const onTimePayments = installments.reduce((count, inst) => {
      return count + inst.payments.filter(p => {
        if (p.status === 'paid' && p.paidDate) {
          const paidDate = parseISO(p.paidDate);
          const dueDate = parseISO(p.dueDate);
          return paidDate <= dueDate;
        }
        return false;
      }).length;
    }, 0);

    if (onTimePayments >= 10) {
      badges.push({
        id: 'punctual-payer',
        name: 'Pagador Pontual',
        description: 'Pagou 10 parcelas em dia',
        icon: '⏰',
        earnedAt: now.toISOString(),
        rarity: 'rare' as const
      });
    }

    // Badge: Recuperação (específico para quem se recuperou de atrasos)
    const lateButPaidPayments = installments.reduce((count, inst) => {
      return count + inst.payments.filter(p => {
        if (p.status === 'paid' && p.paidDate) {
          const paidDate = parseISO(p.paidDate);
          const dueDate = parseISO(p.dueDate);
          return paidDate > dueDate; // Pago com atraso mas pago
        }
        return false;
      }).length;
    }, 0);

    if (lateButPaidPayments >= 3) {
      badges.push({
        id: 'recovery-master',
        name: 'Mestre da Recuperação',
        description: 'Se recuperou de atrasos e quitou débitos',
        icon: '💪',
        earnedAt: now.toISOString(),
        rarity: 'rare' as const
      });
    }

    // Badge: Finalizador
    const completedInstallments = installments.filter(inst => inst.isCompleted);
    if (completedInstallments.length >= 3) {
      badges.push({
        id: 'finisher',
        name: 'Finalizador',
        description: 'Completou 3 parcelamentos',
        icon: '🏆',
        earnedAt: now.toISOString(),
        rarity: 'epic' as const
      });
    }

    // Badge: Zero Atraso (nunca teve atraso)
    const hasOverduePayments = installments.some(inst =>
      inst.payments.some(p => p.status === 'overdue' ||
        (p.status === 'paid' && p.paidDate && parseISO(p.paidDate) > parseISO(p.dueDate))
      )
    );

    if (!hasOverduePayments && onTimePayments >= 5) {
      badges.push({
        id: 'zero-delay',
        name: 'Zero Atraso',
        description: 'Nunca atrasou um pagamento',
        icon: '🌟',
        earnedAt: now.toISOString(),
        rarity: 'legendary' as const
      });
    }

    return badges;
  } private async calculateAchievements(userId: string, installments: Installment[]) {
    const achievements = [];

    // Achievement: Organização total
    const totalPayments = installments.reduce((sum, inst) => sum + inst.totalInstallments, 0);
    const paidPayments = installments.reduce((sum, inst) => sum + inst.paidInstallments, 0);

    achievements.push({
      id: 'total-organization',
      name: 'Organização Total',
      description: 'Pague todas as suas parcelas ativas',
      icon: '📊',
      progress: paidPayments,
      target: totalPayments,
      isCompleted: totalPayments > 0 && paidPayments === totalPayments,
      completedAt: totalPayments > 0 && paidPayments === totalPayments ? new Date().toISOString() : undefined,
      points: 100
    });

    // Achievement: Mestre da pontualidade
    const onTimePayments = installments.reduce((count, inst) => {
      return count + inst.payments.filter(p => {
        if (p.status === 'paid' && p.paidDate) {
          const paidDate = parseISO(p.paidDate);
          const dueDate = parseISO(p.dueDate);
          return paidDate <= dueDate;
        }
        return false;
      }).length;
    }, 0);

    achievements.push({
      id: 'punctuality-master',
      name: 'Mestre da Pontualidade',
      description: 'Pague 50 parcelas em dia',
      icon: '⚡',
      progress: onTimePayments,
      target: 50,
      isCompleted: onTimePayments >= 50,
      completedAt: onTimePayments >= 50 ? new Date().toISOString() : undefined,
      points: 200
    });

    // Achievement: Caçador de Atrasos
    const overduePayments = installments.reduce((count, inst) => {
      return count + inst.payments.filter(p => p.status === 'overdue').length;
    }, 0);

    achievements.push({
      id: 'overdue-hunter',
      name: 'Caçador de Atrasos',
      description: 'Quite todas as parcelas em atraso',
      icon: '🎯',
      progress: Math.max(0, 10 - overduePayments), // Progresso invertido (menos atrasos = mais progresso)
      target: 10,
      isCompleted: overduePayments === 0 && installments.some(inst => inst.payments.length > 0),
      completedAt: overduePayments === 0 && installments.some(inst => inst.payments.length > 0) ? new Date().toISOString() : undefined,
      points: 150
    }); return achievements;
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
