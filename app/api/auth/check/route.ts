import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '../../../lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = verifyAdminToken(cookieStore.get('admin_token')?.value);
  return NextResponse.json({ isAdmin });
}
