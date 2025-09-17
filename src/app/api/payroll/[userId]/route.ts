import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PayrollData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const payrollCollection = db.collection('payroll');
    
    const payrollData = await payrollCollection.findOne({ userId: params.userId });
    
    if (!payrollData) {
      return NextResponse.json({ error: 'Payroll data not found' }, { status: 404 });
    }

    // Convert MongoDB _id to string id
    const { _id, ...payrollToReturn } = payrollData;
    payrollToReturn.id = _id.toHexString();

    return NextResponse.json(payrollToReturn);
  } catch (error) {
    console.error('Error fetching payroll data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const payrollData: PayrollData = await request.json();
    
    // Validate required fields
    if (!payrollData.userId || payrollData.grossSalary === undefined || payrollData.allowances === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure userId matches the route parameter
    if (payrollData.userId !== params.userId) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const payrollCollection = db.collection('payroll');

    // Validate discounts array
    if (!Array.isArray(payrollData.discounts)) {
      payrollData.discounts = [];
    }

    // Ensure each discount has required fields
    payrollData.discounts = payrollData.discounts.map(discount => ({
      id: discount.id || Date.now().toString(),
      name: discount.name || '',
      amount: typeof discount.amount === 'number' ? discount.amount : 0,
    }));

    // Calculate net salary
    const totalDiscounts = payrollData.discounts.reduce((sum, discount) => sum + discount.amount, 0);
    payrollData.netSalary = payrollData.grossSalary + payrollData.allowances - totalDiscounts;
    payrollData.updatedAt = new Date().toISOString();

    // Remove the id field for MongoDB operations
    const { id, ...dataToSave } = payrollData;

    // Use upsert to create or update the document
    const result = await payrollCollection.replaceOne(
      { userId: params.userId },
      dataToSave,
      { upsert: true }
    );

    // Fetch the updated document
    const updatedPayroll = await payrollCollection.findOne({ userId: params.userId });
    
    if (!updatedPayroll) {
      throw new Error('Failed to retrieve updated payroll data');
    }

    // Convert MongoDB _id to string id
    const { _id, ...payrollToReturn } = updatedPayroll;
    payrollToReturn.id = _id.toHexString();

    return NextResponse.json(payrollToReturn);
  } catch (error) {
    console.error('Error saving payroll data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const payrollCollection = db.collection('payroll');
    
    const result = await payrollCollection.deleteOne({ userId: params.userId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Payroll data not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Payroll data deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}