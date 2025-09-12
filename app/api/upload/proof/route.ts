import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, message: 'Authorization token missing or malformed' };
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'demo_jwt_secret_key_for_development');
    return { authenticated: true, user_id: decoded.user_id, email: decoded.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { authenticated: false, message: 'Invalid or expired token' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('proof_image') as File;
    const depositId = formData.get('deposit_id') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    if (!depositId) {
      return NextResponse.json({ success: false, message: 'Deposit ID is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        message: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Verify deposit belongs to user
    const [deposits] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM deposits WHERE deposit_id = ? AND user_id = ?',
      [depositId, authResult.user_id]
    );

    if (deposits.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Deposit not found or access denied' 
      }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'proofs');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `proof_${depositId}_${timestamp}_${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update database with proof image path
    const relativePath = `/uploads/proofs/${fileName}`;
    await db.execute(
      'UPDATE deposits SET proof_image = ? WHERE deposit_id = ?',
      [relativePath, depositId]
    );

    return NextResponse.json({
      success: true,
      message: 'Proof image uploaded successfully',
      data: {
        proof_image: relativePath,
        deposit_id: depositId
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
