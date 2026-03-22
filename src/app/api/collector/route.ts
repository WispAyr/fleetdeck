import { NextResponse } from 'next/server';
import { collectAll, startCollector } from '@/lib/collector';

// Start collector on first API hit
let started = false;

export async function GET() {
  if (!started) {
    startCollector(30000);
    started = true;
  }
  return NextResponse.json({ status: 'collector running' });
}

export async function POST() {
  // Manual trigger
  try {
    await collectAll();
    return NextResponse.json({ status: 'collected' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
