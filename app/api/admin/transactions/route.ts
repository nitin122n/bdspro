import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

// Helper function to verify admin JWT token
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, message: 'Authorization token missing or malformed' };
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'demo_jwt_secret_key_for_development');
    
    // Check if user is admin (you can add admin role check here)
    // For now, we'll allow any authenticated user to be admin
    return { authenticated: true, user_id: decoded.user_id, email: decoded.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { authenticated: false, message: 'Invalid or expired token' };
  }
}

// GET - Fetch all transactions for admin panel
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    const [transactions] = await db.execute<RowDataPacket[]>(`
      SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.user_id
      WHERE t.type = 'deposit'
      ORDER BY t.timestamp DESC
    `);

    return NextResponse.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Handle admin actions (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    const body = await request.json();
    const { action, transaction_id } = body;

    if (!action || !transaction_id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Action and transaction_id are required' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Must be approve or reject' 
      }, { status: 400 });
    }

    // Get transaction details
    const [transactions] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM transactions WHERE id = ?',
      [transaction_id]
    );

    if (transactions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Transaction not found' 
      }, { status: 404 });
    }

    const transaction = transactions[0];

    if (transaction.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        message: 'Transaction has already been processed' 
      }, { status: 400 });
    }

    // Start transaction
    await db.execute('START TRANSACTION');

    try {
      if (action === 'approve') {
        // Update transaction status to verified
        await db.execute(
          'UPDATE transactions SET status = ? WHERE id = ?',
          ['verified', transaction_id]
        );

        // Add balance to user's wallet
        await db.execute(`
          INSERT INTO user_wallets (user_id, balance) 
          VALUES (?, ?) 
          ON DUPLICATE KEY UPDATE balance = balance + ?
        `, [transaction.user_id, transaction.amount, transaction.amount]);

        // Update user's account balance
        await db.execute(
          'UPDATE users SET account_balance = account_balance + ? WHERE user_id = ?',
          [transaction.amount, transaction.user_id]
        );

        // Create a new transaction record for the wallet credit
        await db.execute(`
          INSERT INTO transactions (user_id, type, amount, credit, debit, balance, description, status)
          VALUES (?, 'deposit', ?, ?, 0, 
            (SELECT account_balance FROM users WHERE user_id = ?), 
            'Deposit approved and added to wallet', 'completed')
        `, [transaction.user_id, transaction.amount, transaction.amount, transaction.user_id]);

      } else if (action === 'reject') {
        // Update transaction status to rejected
        await db.execute(
          'UPDATE transactions SET status = ? WHERE id = ?',
          ['rejected', transaction_id]
        );
      }

      // Commit transaction
      await db.execute('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Transaction ${action}d successfully`,
        data: {
          transaction_id,
          action,
          new_status: action === 'approve' ? 'verified' : 'rejected'
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await db.execute('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
