// price-api/src/paypal.ts
import type { Env } from './types';

export interface PayPalWebhookEvent {
  id?: string;
  event_type?: string;
  create_time?: string;
  resource_type?: string;
  resource?: {
    id?: string;
    billing_agreement_id?: string;
    subscription_id?: string;
    custom_id?: string;
    plan_id?: string;
    subscriber?: {
      payer_id?: string;
      email_address?: string;
    };
  };
}

interface PayPalOauthResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

interface PayPalVerifyResponse {
  verification_status?: 'SUCCESS' | 'FAILURE' | 'UNKNOWN';
}

function getPayPalBaseUrl(paypalEnv: Env['PAYPAL_ENV']): string {
  return paypalEnv === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

/**
 * btoa() n'accepte que du "latin1". Les identifiants PayPal sont normalement ASCII,
 * mais on encode proprement au cas où.
 */
function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function getPayPalAccessToken(env: Env): Promise<string> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error('paypal_oauth_missing_client_credentials');
  }

  const credentials = `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`;
  const encoded = toBase64(credentials);

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

  const data = (await response.json()) as PayPalOauthResponse;
  if (!data.access_token) {
    throw new Error('paypal_oauth_missing_token');
  }

  return data.access_token;
}

/**
 * Vérifie la signature d’un webhook PayPal via:
 * POST /v1/notifications/verify-webhook-signature
 *
 * Important:
 * - PAYPAL_WEBHOOK_ID doit être la valeur "Webhook ID" (côté PayPal developer dashboard),
 *   pas l'URL.
 */
export async function verifyPayPalWebhookSignature(
  request: Request,
  env: Env,
  webhookEvent: PayPalWebhookEvent,
): Promise<boolean> {
  try {
    if (!env.PAYPAL_WEBHOOK_ID) {
      console.warn('paypal_signature_verification_failed', {
        reason: 'missing_env_PAYPAL_WEBHOOK_ID',
      });
      return false;
    }

    const transmissionId = request.headers.get('paypal-transmission-id');
    const transmissionTime = request.headers.get('paypal-transmission-time');
    const certUrl = request.headers.get('paypal-cert-url');
    const authAlgo = request.headers.get('paypal-auth-algo');
    const transmissionSig = request.headers.get('paypal-transmission-sig');

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.warn('paypal_signature_verification_failed', {
        reason: 'missing_signature_headers',
        missing: {
          transmissionId: !transmissionId,
          transmissionTime: !transmissionTime,
          certUrl: !certUrl,
          authAlgo: !authAlgo,
          transmissionSig: !transmissionSig,
        },
      });
      return false;
    }

    const accessToken = await getPayPalAccessToken(env);

    const verificationResponse = await fetch(
      `${getPayPalBaseUrl(env.PAYPAL_ENV)}/v1/notifications/verify-webhook-signature`,
      {
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
      },
    );

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
        eventId: webhookEvent.id ?? 'unknown',
        eventType: webhookEvent.event_type ?? 'unknown',
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('paypal_signature_verification_failed', {
      error: error instanceof Error ? error.message : String(error),
      eventId: webhookEvent?.id ?? 'unknown',
      eventType: webhookEvent?.event_type ?? 'unknown',
    });
    return false;
  }
}