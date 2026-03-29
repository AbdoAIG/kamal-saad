/**
 * Paymob Payment Gateway Integration
 * Documentation: https://docs.paymob.com/
 */

// Paymob Configuration
export const PAYMOB_CONFIG = {
  apiKey: process.env.PAYMOB_API_KEY || '',
  integrationId: {
    card: process.env.PAYMOB_CARD_INTEGRATION_ID || '',
    wallet: process.env.PAYMOB_WALLET_INTEGRATION_ID || '',
    kiosk: process.env.PAYMOB_KIOSK_INTEGRATION_ID || '',
  },
  iframeId: process.env.PAYMOB_IFRAME_ID || '',
  hmacSecret: process.env.PAYMOB_HMAC_SECRET || process.env.PAYMOB_HMAC || '',
  baseUrl: 'https://accept.paymob.com/api',
};

// Types
export interface PaymobAuthResponse {
  token: string;
}

export interface PaymobOrderRequest {
  auth_token: string;
  delivery_needed: boolean;
  amount_cents: number;
  currency: string;
  merchant_order_id: string;
  items: {
    name: string;
    amount_cents: number;
    quantity: number;
  }[];
  shipping_data?: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    country: string;
    city: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
  };
}

export interface PaymobOrderResponse {
  id: number;
  created_at: string;
  currency: string;
  amount_cents: number;
  merchant_order_id: string;
}

export interface PaymobPaymentKeyRequest {
  auth_token: string;
  amount_cents: number;
  expiration: number;
  order_id: number;
  billing_data: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    country: string;
    city: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
  };
  currency: string;
  integration_id: number;
  lock_order_when_paid: boolean;
}

export interface PaymobPaymentKeyResponse {
  token: string;
}

export interface PaymobWalletPayRequest {
  auth_token: string;
  payment_token: string;
  wallet_number: string;
}

export interface PaymobKioskPayRequest {
  auth_token: string;
  payment_token: string;
}

export interface PaymobCallbackData {
  type: 'card' | 'wallet' | 'kiosk';
  obj: {
    id: number;
    order: {
      id: number;
      merchant_order_id: string;
    };
    amount_cents: number;
    currency: string;
    success: boolean;
    pending: boolean;
    is_refunded: boolean;
    is_3d_secure: boolean;
    error_occured: boolean;
    source_data: {
      type: string;
      sub_type: string;
      phone_number?: string;
      bill_reference?: string;
    };
    data: {
      message?: string;
      txn_response_code?: string;
    };
    hmac: string;
  };
}

/**
 * Step 1: Authentication - Get Auth Token
 */
export async function getAuthToken(): Promise<string> {
  console.log('[Paymob] Getting auth token...');
  
  if (!PAYMOB_CONFIG.apiKey) {
    throw new Error('PAYMOB_API_KEY is not configured');
  }
  
  const response = await fetch(`${PAYMOB_CONFIG.baseUrl}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: PAYMOB_CONFIG.apiKey }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Paymob] Auth failed:', error);
    throw new Error(`Paymob Auth Failed: ${error}`);
  }

  const data: PaymobAuthResponse = await response.json();
  console.log('[Paymob] Auth successful');
  return data.token;
}

/**
 * Step 2: Create Order
 */
export async function createOrder(
  token: string,
  orderData: {
    orderId: string;
    amountCents: number;
    items: { name: string; amountCents: number; quantity: number }[];
    shippingData?: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      country: string;
      city: string;
      street: string;
      building: string;
      floor: string;
      apartment: string;
    };
  }
): Promise<number> {
  console.log('[Paymob] Creating order:', orderData.orderId, 'Amount:', orderData.amountCents);
  
  // Filter out items with negative amounts and calculate the correct total
  const validItems = orderData.items.filter(item => item.amountCents > 0);
  
  // Use a shorter merchant order ID (Paymob has limits)
  const merchantOrderId = orderData.orderId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
  
  const request: PaymobOrderRequest = {
    auth_token: token,
    delivery_needed: false,
    amount_cents: orderData.amountCents,
    currency: 'EGP',
    merchant_order_id: merchantOrderId,
    items: validItems.length > 0 ? validItems : [{ name: 'Order', amountCents: orderData.amountCents, quantity: 1 }],
    shipping_data: orderData.shippingData ? {
      first_name: orderData.shippingData.firstName || 'Customer',
      last_name: orderData.shippingData.lastName || 'Customer',
      phone_number: orderData.shippingData.phone || '01000000000',
      email: orderData.shippingData.email || 'customer@example.com',
      country: orderData.shippingData.country || 'EG',
      city: orderData.shippingData.city || 'Cairo',
      street: orderData.shippingData.street || 'NA',
      building: orderData.shippingData.building || 'NA',
      floor: orderData.shippingData.floor || 'NA',
      apartment: orderData.shippingData.apartment || 'NA',
    } : undefined,
  };

  console.log('[Paymob] Order request:', JSON.stringify(request, null, 2));

  const response = await fetch(`${PAYMOB_CONFIG.baseUrl}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Paymob] Order creation failed:', error);
    console.error('[Paymob] Request was:', JSON.stringify(request, null, 2));
    throw new Error(`Paymob Order Creation Failed: ${error}`);
  }

  const data: PaymobOrderResponse = await response.json();
  console.log('[Paymob] Order created:', data.id);
  return data.id;
}

/**
 * Step 3: Get Payment Key
 */
export async function getPaymentKey(
  token: string,
  orderId: number,
  amountCents: number,
  billingData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    city: string;
    street: string;
  },
  integrationType: 'card' | 'wallet' | 'kiosk' = 'card'
): Promise<string> {
  console.log('[Paymob] Getting payment key for order:', orderId, 'Method:', integrationType);
  
  const integrationId = PAYMOB_CONFIG.integrationId[integrationType];
  
  if (!integrationId) {
    throw new Error(`Paymob integration ID not configured for ${integrationType}`);
  }

  console.log('[Paymob] Using integration ID:', integrationId);

  const request: PaymobPaymentKeyRequest = {
    auth_token: token,
    amount_cents: amountCents,
    expiration: 3600, // 1 hour
    order_id: orderId,
    billing_data: {
      first_name: billingData.firstName || 'Customer',
      last_name: billingData.lastName || 'Customer',
      phone_number: billingData.phone,
      email: billingData.email || 'customer@example.com',
      country: 'EG',
      city: billingData.city || 'Cairo',
      street: billingData.street || 'NA',
      building: 'NA',
      floor: 'NA',
      apartment: 'NA',
    },
    currency: 'EGP',
    integration_id: parseInt(integrationId),
    lock_order_when_paid: true,
  };

  console.log('[Paymob] Payment key request:', JSON.stringify(request, null, 2));

  const response = await fetch(`${PAYMOB_CONFIG.baseUrl}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Paymob] Payment key failed:', error);
    throw new Error(`Paymob Payment Key Failed: ${error}`);
  }

  const data: PaymobPaymentKeyResponse = await response.json();
  console.log('[Paymob] Payment key obtained');
  return data.token;
}

/**
 * Step 4a: Pay with Card - Get Iframe URL
 */
export function getCardPaymentUrl(paymentKey: string): string {
  const iframeId = PAYMOB_CONFIG.iframeId;
  if (!iframeId) {
    throw new Error('Paymob iframe ID not configured');
  }
  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;
}

/**
 * Step 4b: Pay with Mobile Wallet
 */
export async function payWithWallet(
  token: string,
  paymentKey: string,
  walletNumber: string
): Promise<{ success: boolean; redirectUrl?: string; message?: string }> {
  const response = await fetch(`${PAYMOB_CONFIG.baseUrl}/acceptance/payments/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      payment_token: paymentKey,
      wallet_number: walletNumber,
    } as PaymobWalletPayRequest),
  });

  const data = await response.json();

  if (data.redirect_url) {
    return { success: true, redirectUrl: data.redirect_url };
  }

  if (data.pending) {
    return { success: true, message: 'في انتظار تأكيد الدفع' };
  }

  return { 
    success: false, 
    message: data.data?.message || 'فشل في عملية الدفع'
  };
}

/**
 * Step 4c: Pay with Kiosk (Fawry)
 */
export async function payWithKiosk(
  token: string,
  paymentKey: string
): Promise<{ success: boolean; billReference?: string; message?: string }> {
  const response = await fetch(`${PAYMOB_CONFIG.baseUrl}/acceptance/payments/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      payment_token: paymentKey,
      source: {
        identifier: 'AGGREGATOR',
        subtype: 'AGGREGATOR',
      },
    }),
  });

  const data = await response.json();

  if (data.pending && data.source_data?.bill_reference) {
    return { 
      success: true, 
      billReference: data.source_data.bill_reference,
      message: 'يمكنك الدفع من أي فرع فوري أو أجري'
    };
  }

  return { 
    success: false, 
    message: data.data?.message || 'فشل في إنشاء رقم الفاتورة'
  };
}

/**
 * Verify HMAC signature for callback security
 */
export function verifyHmac(data: string, hmac: string): boolean {
  const crypto = require('crypto');
  const expectedHmac = crypto
    .createHmac('sha512', PAYMOB_CONFIG.hmacSecret)
    .update(data)
    .digest('hex');
  return expectedHmac === hmac;
}

/**
 * Calculate HMAC for callback verification
 */
export function calculateHmac(callbackData: any): string {
  const crypto = require('crypto');
  
  // Build the string to sign based on Paymob's requirements
  const concatenatedString = 
    (callbackData.amount_cents || '') +
    (callbackData.created_at || '') +
    (callbackData.currency || '') +
    (callbackData.error_occured || '') +
    (callbackData.has_parent_transaction || '') +
    (callbackData.id || '') +
    (callbackData.integration_id || '') +
    (callbackData.is_3d_secure || '') +
    (callbackData.is_auth || '') +
    (callbackData.is_capture || '') +
    (callbackData.is_refunded || '') +
    (callbackData.is_standalone_payment || '') +
    (callbackData.is_voided || '') +
    (callbackData.order?.id || '') +
    (callbackData.owner || '') +
    (callbackData.pending || '') +
    (callbackData.source_data?.pan || '') +
    (callbackData.source_data?.sub_type || '') +
    (callbackData.source_data?.type || '') +
    (callbackData.success || '');

  return crypto
    .createHmac('sha512', PAYMOB_CONFIG.hmacSecret)
    .update(concatenatedString)
    .digest('hex');
}
