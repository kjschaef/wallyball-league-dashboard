import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { matches } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }
    
    await db.delete(matches).where(eq(matches.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json({ error: "Failed to delete match" }, { status: 500 });
  }
}
