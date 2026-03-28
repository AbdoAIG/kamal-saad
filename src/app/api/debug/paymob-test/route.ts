import { NextResponse } from 'next/server';
import { getAuthToken, PAYMOB_CONFIG } from '@/lib/paymob';

export async function GET() {
  try {
    // Check configuration
    const config = {
      hasApiKey: !!PAYMOB_CONFIG.apiKey,
      apiKeyLength: PAYMOB_CONFIG.apiKey?.length || 0,
      cardIntegrationId: PAYMOB_CONFIG.integrationId.card || 'NOT SET',
      iframeId: PAYMOB_CONFIG.iframeId || 'NOT SET',
    };

    if (!PAYMOB_CONFIG.apiKey) {
      return NextResponse.json({
        success: false,
        error: 'PAYMOB_API_KEY is not configured',
        config
      });
    }

    // Try to get auth token
    const token = await getAuthToken();
    
    return NextResponse.json({
      success: true,
      message: 'Paymob authentication successful',
      tokenPrefix: token.substring(0, 20) + '...',
      config
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      config: {
        hasApiKey: !!PAYMOB_CONFIG.apiKey,
        apiKeyLength: PAYMOB_CONFIG.apiKey?.length || 0,
      }
    });
  }
}
