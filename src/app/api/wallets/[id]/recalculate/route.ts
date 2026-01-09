
import { NextRequest, NextResponse } from 'next/server';
import { WalletBalanceService } from '@/services/wallet-balance-service';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuthenticatedMobileUser } from '@/lib/api-auth';

// POST /api/wallets/[id]/recalculate
// Força o recálculo do saldo de uma carteira baseada nas transações
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Autenticação robusta (suporta cookie e token)
  const authResult = await getAuthenticatedMobileUser(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const userId = authResult.user.id;

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid wallet ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verificar se carteira existe e pertence ao usuário
    const wallet = await db.collection('wallets').findOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Executar recálculo
    await WalletBalanceService.recalculateWalletBalance(id, userId);

    // Buscar saldo atualizado
    const updatedWallet = await db.collection('wallets').findOne({
      _id: new ObjectId(id)
    });

    return NextResponse.json({
      success: true,
      previousBalance: wallet.balance,
      newBalance: updatedWallet?.balance || 0,
      message: 'Saldo recalculado com sucesso com base nas transações.'
    });

  } catch (error) {
    console.error('Error recalculating wallet balance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
