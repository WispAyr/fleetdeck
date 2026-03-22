import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const alerts = db.prepare(`
    SELECT a.*, s.name as server_name 
    FROM alerts a LEFT JOIN servers s ON a.server_id = s.id 
    ORDER BY a.created_at DESC LIMIT 200
  `).all();
  return NextResponse.json(alerts);
}

export async function POST(req: Request) {
  const { id, acknowledged } = await req.json();
  const db = getDb();
  db.prepare('UPDATE alerts SET acknowledged = ? WHERE id = ?').run(acknowledged ? 1 : 0, id);
  return NextResponse.json({ ok: true });
}
