import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const services = db.prepare("SELECT * FROM services WHERE server_id = ? ORDER BY type, name").all(id);
  return NextResponse.json(services);
}
