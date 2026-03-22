import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const deployments = db.prepare(`
    SELECT d.*, s.name as server_name 
    FROM deployments d LEFT JOIN servers s ON d.server_id = s.id 
    ORDER BY d.deployed_at DESC LIMIT 100
  `).all();
  return NextResponse.json(deployments);
}

export async function POST(req: Request) {
  const { server_id, service_name, git_repo, branch, commit_hash, deployed_by, log } = await req.json();
  const db = getDb();
  db.prepare(`INSERT INTO deployments (server_id, service_name, git_repo, branch, commit_hash, deployed_by, log) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    server_id, service_name, git_repo, branch, commit_hash, deployed_by || 'manual', log || ''
  );
  return NextResponse.json({ ok: true });
}
