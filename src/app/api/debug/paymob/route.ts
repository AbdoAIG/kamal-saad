import { NextResponse } from 'next/server';
import { PAYMOB_CONFIG } from '@/lib/paymob';

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!PAYMOB_CONFIG.apiKey,
    apiKeyLength: PAYMOB_CONFIG.apiKey?.length || 0,
    hasHmacSecret: !!PAYMOB_CONFIG.hmacSecret,
    cardIntegrationId: PAYMOB_CONFIG.integrationId.card || 'NOT SET',
    walletIntegrationId: PAYMOB_CONFIG.integrationId.wallet || 'NOT SET',
    kioskIntegrationId: PAYMOB_CONFIG.integrationId.kiosk || 'NOT SET',
    iframeId: PAYMOB_CONFIG.iframeId || 'NOT SET',
  });
}
