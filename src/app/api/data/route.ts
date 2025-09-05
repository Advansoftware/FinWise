// src/app/api/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/core/services/service-factory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (!collection || !userId) {
      return NextResponse.json(
        { error: 'Collection and userId are required' },
        { status: 400 }
      );
    }

    console.log('🔧 Getting database adapter...');
    const db = await getDatabaseAdapter();
    console.log('✅ Database adapter obtained:', !!db);

    if (!db) {
      return NextResponse.json(
        { error: 'Database adapter not available' },
        { status: 500 }
      );
    }

    console.log('🔧 Checking db.transactions:', !!db.transactions);

    switch (collection) {
      case 'transactions':
        if (id) {
          const transaction = await db.transactions.findById(id);
          return NextResponse.json(transaction);
        } else {
          const transactions = await db.transactions.findByUserId(userId);
          return NextResponse.json(transactions);
        }

      case 'wallets':
        if (id) {
          const wallet = await db.wallets.findById(id);
          return NextResponse.json(wallet);
        } else {
          const wallets = await db.wallets.findByUserId(userId);
          return NextResponse.json(wallets);
        }

      case 'budgets':
        if (id) {
          const budget = await db.budgets.findById(id);
          return NextResponse.json(budget);
        } else {
          const budgets = await db.budgets.findByUserId(userId);
          return NextResponse.json(budgets);
        }

      case 'goals':
        if (id) {
          const goal = await db.goals.findById(id);
          return NextResponse.json(goal);
        } else {
          const goals = await db.goals.findByUserId(userId);
          return NextResponse.json(goals);
        }

      case 'aiCreditLogs':
        const logs = await db.aiCreditLogs.findByUserId(userId);
        return NextResponse.json(logs);

      case 'settings':
        const settings = await db.settings.findByUserId(userId);
        return NextResponse.json(settings);

      default:
        return NextResponse.json(
          { error: 'Invalid collection' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const body = await request.json();

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection is required' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAdapter();

    switch (collection) {
      case 'transactions':
        const newTransaction = await db.transactions.create(body);
        return NextResponse.json(newTransaction);

      case 'wallets':
        const newWallet = await db.wallets.create(body);
        return NextResponse.json(newWallet);

      case 'budgets':
        const newBudget = await db.budgets.create(body);
        return NextResponse.json(newBudget);

      case 'goals':
        const newGoal = await db.goals.create(body);
        return NextResponse.json(newGoal);

      case 'aiCreditLogs':
        const newLog = await db.aiCreditLogs.create(body);
        return NextResponse.json(newLog);

      default:
        return NextResponse.json(
          { error: 'Invalid collection for POST' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const id = searchParams.get('id');
    const body = await request.json();

    if (!collection || !id) {
      return NextResponse.json(
        { error: 'Collection and id are required' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAdapter();

    switch (collection) {
      case 'transactions':
        await db.transactions.update(id, body);
        return NextResponse.json({ success: true });

      case 'wallets':
        await db.wallets.update(id, body);
        return NextResponse.json({ success: true });

      case 'budgets':
        await db.budgets.update(id, body);
        return NextResponse.json({ success: true });

      case 'goals':
        await db.goals.update(id, body);
        return NextResponse.json({ success: true });

      case 'settings':
        await db.settings.updateByUserId(id, body);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid collection for PUT' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const id = searchParams.get('id');

    if (!collection || !id) {
      return NextResponse.json(
        { error: 'Collection and id are required' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAdapter();

    switch (collection) {
      case 'transactions':
        await db.transactions.delete(id);
        return NextResponse.json({ success: true });

      case 'wallets':
        await db.wallets.delete(id);
        return NextResponse.json({ success: true });

      case 'budgets':
        await db.budgets.delete(id);
        return NextResponse.json({ success: true });

      case 'goals':
        await db.goals.delete(id);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid collection for DELETE' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
