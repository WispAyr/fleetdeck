import { NextResponse } from 'next/server';
import { execCommand } from '@/lib/ssh';
import { getDb } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params;
  const { action, type } = await req.json();
  
  if (!['start', 'stop', 'restart'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    let cmd = '';
    const svcName = decodeURIComponent(name);
    
    if (type === 'pm2') {
      cmd = `pm2 ${action} ${svcName}`;
    } else if (type === 'systemd') {
      cmd = `sudo systemctl ${action} ${svcName}`;
    } else if (type === 'docker') {
      cmd = `docker ${action} ${svcName}`;
    } else {
      return NextResponse.json({ error: 'Unknown service type' }, { status: 400 });
    }

    const output = await execCommand(id, cmd);
    return NextResponse.json({ ok: true, output });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
