import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const servers = db.prepare('SELECT * FROM servers ORDER BY name').all();
  const parsed = servers.map((s: any) => ({
    ...s,
    ips: JSON.parse(s.ips || '[]'),
    tags: JSON.parse(s.tags || '[]'),
  }));
  
  // Attach latest metrics
  for (const server of parsed) {
    const metric = db.prepare('SELECT * FROM metrics WHERE server_id = ? ORDER BY timestamp DESC LIMIT 1').get(server.id);
    const serviceCount = db.prepare('SELECT COUNT(*) as c FROM services WHERE server_id = ?').get(server.id) as any;
    (server as any).latest_metric = metric || null;
    (server as any).service_count = serviceCount?.c || 0;
  }
  
  return NextResponse.json(parsed);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDb();
  const { id, name, ips, ssh_host, ssh_user, ssh_password, os, role, tags, is_local } = body;
  
  db.prepare(`INSERT INTO servers (id, name, ips, ssh_host, ssh_user, ssh_password_encrypted, os, role, tags, is_local) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, name, JSON.stringify(ips || []), ssh_host, ssh_user, ssh_password || '', os, role, JSON.stringify(tags || []), is_local ? 1 : 0
  );
  
  return NextResponse.json({ ok: true });
}
