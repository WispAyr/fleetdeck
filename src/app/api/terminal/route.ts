import { NextResponse } from 'next/server';
import { execCommand } from '@/lib/ssh';

export async function POST(req: Request) {
  const { serverId, command } = await req.json();
  
  if (!serverId || !command) {
    return NextResponse.json({ error: 'Missing serverId or command' }, { status: 400 });
  }

  try {
    const output = await execCommand(serverId, command, 15000);
    return NextResponse.json({ output });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
