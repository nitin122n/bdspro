import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN START ===');
    
    const body = await request.json();
    console.log('Request body received:', { email: body.email });
    
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Test database connection first
    console.log('Testing database connection...');
    try {
      const [testResult] = await db.execute('SELECT 1 as test');
      console.log('Database connection successful:', testResult);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      if (dbError instanceof Error) {
        return NextResponse.json(
          { success: false, message: 'Database connection failed', error: dbError.message },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { success: false, message: 'Database connection failed', error: 'Unknown database error' },
          { status: 500 }
        );
      }
    }

    // Find user by email
    console.log('Looking for user with email:', email);
    try {
      const [users] = await db.execute<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
      console.log('Users found:', users.length);
      
      if (users.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const user = (users as RowDataPacket[])[0];
      console.log('User found:', { user_id: user.user_id, name: user.name, email: user.email });

      // Check password
      console.log('Checking password...');
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate Access Token (short-lived)
      const accessToken = jwt.sign(
        { user_id: user.user_id, email: user.email },
        process.env.JWT_SECRET || 'demo_jwt_secret_key_for_development',
        { expiresIn: '15m' } // 15 minutes
      );

      // Generate Refresh Token (long-lived)
      const refreshToken = jwt.sign(
        { user_id: user.user_id },
        process.env.JWT_REFRESH_SECRET || 'demo_refresh_secret_key_for_development',
        { expiresIn: '7d' } // 7 days
      );

      // Store refresh token in database for security
      try {
        await db.execute(
          'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY)) ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)',
          [user.user_id, refreshToken]
        );
      } catch (tokenError) {
        console.error('Error storing refresh token:', tokenError);
        // Continue with login even if refresh token storage fails
      }

      const userData = {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        account_balance: user.account_balance || 0.00,
        total_earning: user.total_earning || 0.00,
        rewards: user.rewards || 0.00
      };

      console.log('Login successful, returning user data:', userData);

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      });
      
    } catch (dbError) {
      console.error('Error during login:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database error during login', error: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
