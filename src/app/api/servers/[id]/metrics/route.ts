import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const metrics = db.prepare("SELECT * FROM metrics WHERE server_id = ? ORDER BY timestamp DESC LIMIT 100").all(id);
  return NextResponse.json(metrics);
}
