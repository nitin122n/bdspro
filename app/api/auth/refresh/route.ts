import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 401 }
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'demo_refresh_secret_key_for_development'
      ) as any;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 403 }
      );
    }

    // Check if refresh token exists in database and is not expired
    const [tokens] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [decoded.user_id, refreshToken]
    );

    if (tokens.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Refresh token not found or expired' },
        { status: 403 }
      );
    }

    // Get user data
    const [users] = await db.execute<RowDataPacket[]>(
      'SELECT user_id, email FROM users WHERE user_id = ?',
      [decoded.user_id]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET || 'demo_jwt_secret_key_for_development',
      { expiresIn: '15m' } // 15 minutes
    );

    return NextResponse.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
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
