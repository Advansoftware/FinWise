// src/app/api/reports/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {getDatabaseAdapter} from '@/core/services/service-factory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as 'monthly' | 'annual' | null;
    const period = searchParams.get('period');
    const latest = searchParams.get('latest') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAdapter();
    if (!db) {
      return NextResponse.json(
        { error: 'Database adapter not available' },
        { status: 500 }
      );
    }

    // Se especificar período específico
    if (period) {
      const report = await db.reports.findByUserIdAndPeriod(userId, period);
      return NextResponse.json(report);
    }

    // Se quiser o último relatório de um tipo
    if (latest && type) {
      const report = await db.reports.findLatestByUserIdAndType(userId, type);
      return NextResponse.json(report);
    }

    // Se especificar tipo
    if (type) {
      const reports = await db.reports.findByUserIdAndType(userId, type);
      return NextResponse.json(reports);
    }

    // Buscar todos os relatórios do usuário
    const reports = await db.reports.findByUserId(userId);
    return NextResponse.json(reports);

  } catch (error) {
    console.error('Reports GET failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.userId || !body.type || !body.period || !body.data) {
      return NextResponse.json(
        { error: 'userId, type, period and data are required' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAdapter();
    if (!db) {
      return NextResponse.json(
        { error: 'Database adapter not available' },
        { status: 500 }
      );
    }

    // Verificar se já existe um relatório para este período
    const existingReport = await db.reports.findByUserIdAndPeriod(body.userId, body.period);

    if (existingReport) {
      // Atualizar o relatório existente
      await db.reports.update(existingReport.id, {
        data: body.data,
        generatedAt: new Date(),
      });

      const updatedReport = await db.reports.findByUserIdAndPeriod(body.userId, body.period);
      return NextResponse.json(updatedReport);
    } else {
      // Criar novo relatório
      const newReport = await db.reports.create({
        userId: body.userId,
        type: body.type,
        period: body.period,
        data: body.data,
        generatedAt: new Date(),
      }); return NextResponse.json(newReport);
    }

  } catch (error) {
    console.error('Reports POST failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const db = await getDatabaseAdapter();
    if (!db) {
      return NextResponse.json(
        { error: 'Database adapter not available' },
        { status: 500 }
      );
    }

    await db.reports.update(id, body);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reports PUT failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = await getDatabaseAdapter();
    if (!db) {
      return NextResponse.json(
        { error: 'Database adapter not available' },
        { status: 500 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    await db.reports.delete(id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reports DELETE failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
