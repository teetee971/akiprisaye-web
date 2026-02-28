import type { Env } from './types';

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  create_time?: string;
  resource?: {
    id?: string;
    custom_id?: string;
    plan_id?: string;
    subscriber?: {
      payer_id?: string;
      email_address?: string;
    };
  };
}

interface PayPalVerifyResponse {
  verification_status?: string;
}

function getPayPalBaseUrl(paypalEnv: Env['PAYPAL_ENV']): string {
  return paypalEnv === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken(env: Env): Promise<string> {
  const credentials = `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`;
  const encoded = btoa(credentials);
  const response = await fetch(`${getPayPalBaseUrl(env.PAYPAL_ENV)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`paypal_oauth_failed:${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('paypal_oauth_missing_token');
  }

  return data.access_token;
}

export async function verifyPayPalWebhookSignature(
  request: Request,
  env: Env,
  webhookEvent: PayPalWebhookEvent,
): Promise<boolean> {
  try {
    const transmissionId = request.headers.get('paypal-transmission-id');
    const transmissionTime = request.headers.get('paypal-transmission-time');
    const certUrl = request.headers.get('paypal-cert-url');
    const authAlgo = request.headers.get('paypal-auth-algo');
    const transmissionSig = request.headers.get('paypal-transmission-sig');

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.warn('paypal_signature_verification_failed', {
        reason: 'missing_signature_headers',
      });
      return false;
    }

    const accessToken = await getPayPalAccessToken(env);
    const verificationResponse = await fetch(`${getPayPalBaseUrl(env.PAYPAL_ENV)}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: env.PAYPAL_WEBHOOK_ID,
        webhook_event: webhookEvent,
      }),
    });

    if (!verificationResponse.ok) {
      console.warn('paypal_signature_verification_failed', {
        reason: 'verify_endpoint_non_200',
        status: verificationResponse.status,
      });
      return false;
    }

    const verificationResult = (await verificationResponse.json()) as PayPalVerifyResponse;
    if (verificationResult.verification_status !== 'SUCCESS') {
      console.warn('paypal_signature_verification_failed', {
        reason: 'verification_status_not_success',
        verificationStatus: verificationResult.verification_status ?? 'undefined',
      });
    }
    return verificationResult.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('paypal_signature_verification_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
