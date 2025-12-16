// src/app/api/pluggy/smart-transfers/preauthorizations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPluggyService } from '@/services/pluggy';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/pluggy/smart-transfers/preauthorizations
 * List user's preauthorizations or get a specific one
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const preauthorizationId = searchParams.get('preauthorizationId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get specific preauthorization
    if (preauthorizationId) {
      const pluggyService = getPluggyService();

      // First check if this preauthorization belongs to the user
      const storedAuth = await db.collection('smart_transfer_preauthorizations').findOne({
        userId,
        pluggyPreauthorizationId: preauthorizationId
      });

      if (!storedAuth) {
        return NextResponse.json(
          { error: 'Preauthorization not found' },
          { status: 404 }
        );
      }

      // Get latest status from Pluggy
      const preauthorization = await pluggyService.getSmartTransferPreauthorization(preauthorizationId);

      // Update stored status if changed
      if (preauthorization.status !== storedAuth.status) {
        await db.collection('smart_transfer_preauthorizations').updateOne(
          { _id: storedAuth._id },
          {
            $set: {
              status: preauthorization.status,
              updatedAt: new Date().toISOString()
            }
          }
        );
      }

      return NextResponse.json({ preauthorization, storedAuth });
    }

    // List all user's preauthorizations
    const preauthorizations = await db.collection('smart_transfer_preauthorizations')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Find active (COMPLETED) preauthorization
    const activePreauthorization = preauthorizations.find(p => p.status === 'COMPLETED');

    return NextResponse.json({
      preauthorizations,
      activePreauthorization: activePreauthorization || null,
      hasActivePreauthorization: !!activePreauthorization
    });

  } catch (error: any) {
    console.error('Error fetching preauthorizations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preauthorizations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pluggy/smart-transfers/preauthorizations
 * Create a new preauthorization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      connectorId, // Bank connector ID (e.g., 612 for Nubank)
      cpf,
      cnpj,
      recipientIds, // Pluggy recipient IDs to authorize
      configuration, // Optional limits
      callbackUrls,
    } = body;

    if (!userId || !connectorId || !cpf || !recipientIds?.length) {
      return NextResponse.json(
        { error: 'userId, connectorId, cpf, and recipientIds are required' },
        { status: 400 }
      );
    }

    const pluggyService = getPluggyService();
    const { db } = await connectToDatabase();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    // Create preauthorization in Pluggy
    const preauthorization = await pluggyService.createSmartTransferPreauthorization({
      connectorId,
      parameters: {
        cpf,
        ...(cnpj && { cnpj }),
      },
      recipientIds,
      callbackUrls: callbackUrls || {
        success: `${baseUrl}/pagamentos/autorizacao-sucesso`,
        error: `${baseUrl}/pagamentos/autorizacao-erro`,
      },
      configuration: configuration || {
        transactionLimit: 10000, // R$ 10.000 per transaction
        periodicLimits: {
          month: {
            transactionLimit: 50000, // R$ 50.000 per month
            quantityLimit: 100, // 100 transactions per month
          }
        }
      },
    });

    // Store preauthorization in database
    const storedAuth = await db.collection('smart_transfer_preauthorizations').insertOne({
      userId,
      pluggyPreauthorizationId: preauthorization.id,
      connectorId,
      connectorName: preauthorization.connector?.name || 'Unknown',
      recipientIds,
      status: preauthorization.status,
      consentUrl: preauthorization.consentUrl,
      configuration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      preauthorization: {
        id: preauthorization.id,
        status: preauthorization.status,
        consentUrl: preauthorization.consentUrl,
        connector: preauthorization.connector,
      },
      storedId: storedAuth.insertedId.toString(),
      // User needs to visit consentUrl to authorize
      message: 'Redirecione o usuário para consentUrl para autorizar os pagamentos',
    });

  } catch (error: any) {
    console.error('Error creating preauthorization:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create preauthorization' },
      { status: 500 }
    );
  }
}
