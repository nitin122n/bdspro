import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'demo_jwt_secret_key_for_development'
    ) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/payments - Get user's payments
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's payments from database
    const [payments] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC',
      [user.user_id]
    );

    return NextResponse.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { network, address, amount, transaction_hash } = body;

    if (!network || !address || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert payment into database
    const [result] = await db.execute(
      'INSERT INTO deposits (user_id, network, address, amount, transaction_hash, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user.user_id, network, address, amount, transaction_hash || null, 'pending']
    );

    const insertResult = result as any;
    const paymentId = insertResult.insertId;

    return NextResponse.json({
      success: true,
      message: 'Payment created successfully',
      data: {
        paymentId,
        network,
        address,
        amount,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
