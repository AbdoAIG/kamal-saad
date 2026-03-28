import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

// Sentry tunnel route to circumvent ad-blockers
export async function POST(request: Request) {
  const envelope = await request.text();
  await Sentry.captureEnvelope(envelope);
  return NextResponse.json({ success: true });
}
