import { describe, expect, it } from 'vitest';
import { recordWebhookEventIfNew, upsertSubscriptionByPayPalId } from '../src/db';
import { mapPayPalEventTypeToSubscriptionStatus } from '../src/subscriptionPlans';

interface SubscriptionRow {
  user_id: string;
  plan: string;
  status: string;
  paypal_subscription_id: string;
  payer_id: string | null;
  email: string | null;
}

class FakeD1PreparedStatement {
  private args: unknown[] = [];

  constructor(
    private readonly sql: string,
    private readonly state: { webhookEvents: Set<string>; subscriptions: SubscriptionRow[] },
  ) {}

  bind(...args: unknown[]): this {
    this.args = args;
    return this;
  }

  async run(): Promise<{ meta: { changes: number } }> {
    if (this.sql.includes('INSERT OR IGNORE INTO webhook_events')) {
      const [eventId] = this.args as [string];
      const existed = this.state.webhookEvents.has(eventId);
      if (!existed) {
        this.state.webhookEvents.add(eventId);
      }
      return { meta: { changes: existed ? 0 : 1 } };
    }

    if (this.sql.includes('INSERT INTO subscriptions')) {
      const [userId, plan, status, paypalSubscriptionId, payerId, email] = this.args as [
        string,
        string,
        string,
        string,
        string | null,
        string | null,
      ];

      const existing = this.state.subscriptions.find((item) => item.paypal_subscription_id === paypalSubscriptionId);
      if (existing) {
        existing.user_id = userId;
        existing.plan = plan;
        existing.status = status;
        existing.payer_id = payerId;
        existing.email = email;
      } else {
        this.state.subscriptions.push({
          user_id: userId,
          plan,
          status,
          paypal_subscription_id: paypalSubscriptionId,
          payer_id: payerId,
          email,
        });
      }

      return { meta: { changes: 1 } };
    }

    throw new Error(`Unsupported run SQL in test: ${this.sql}`);
  }

  async first<T>(): Promise<T | null> {
    throw new Error(`Unsupported first SQL in test: ${this.sql}`);
  }
}

class FakeD1Database {
  private readonly state = {
    webhookEvents: new Set<string>(),
    subscriptions: [] as SubscriptionRow[],
  };

  prepare(sql: string): FakeD1PreparedStatement {
    return new FakeD1PreparedStatement(sql, this.state);
  }

  get subscriptions(): SubscriptionRow[] {
    return this.state.subscriptions;
  }
}

describe('subscription webhook logic', () => {
  it('applique idempotence sur webhook_events avec INSERT OR IGNORE', async () => {
    const db = new FakeD1Database() as unknown as D1Database;

    const first = await recordWebhookEventIfNew(db, {
      eventId: 'evt_1',
      eventType: 'BILLING.SUBSCRIPTION.ACTIVATED',
      createTime: '2026-02-23T00:00:00Z',
      rawJson: '{}',
    });

    const second = await recordWebhookEventIfNew(db, {
      eventId: 'evt_1',
      eventType: 'BILLING.SUBSCRIPTION.ACTIVATED',
      createTime: '2026-02-23T00:00:00Z',
      rawJson: '{}',
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('fait un insert puis update pour un même paypal_subscription_id', async () => {
    const fake = new FakeD1Database();
    const db = fake as unknown as D1Database;

    await upsertSubscriptionByPayPalId(db, {
      userId: 'user_1',
      plan: 'PREMIUM_MONTHLY',
      status: 'CREATED',
      paypalSubscriptionId: 'I-SUB-123',
      payerId: 'PAYER-1',
      email: 'old@example.com',
    });

    await upsertSubscriptionByPayPalId(db, {
      userId: 'user_1',
      plan: 'PREMIUM_MONTHLY',
      status: 'ACTIVE',
      paypalSubscriptionId: 'I-SUB-123',
      payerId: 'PAYER-1',
      email: 'new@example.com',
    });

    expect(fake.subscriptions).toHaveLength(1);
    expect(fake.subscriptions[0]?.status).toBe('ACTIVE');
    expect(fake.subscriptions[0]?.email).toBe('new@example.com');
  });

  it('mappe correctement event_type PayPal vers status interne', () => {
    expect(mapPayPalEventTypeToSubscriptionStatus('BILLING.SUBSCRIPTION.CREATED')).toBe('CREATED');
    expect(mapPayPalEventTypeToSubscriptionStatus('BILLING.SUBSCRIPTION.ACTIVATED')).toBe('ACTIVE');
    expect(mapPayPalEventTypeToSubscriptionStatus('BILLING.SUBSCRIPTION.SUSPENDED')).toBe('SUSPENDED');
    expect(mapPayPalEventTypeToSubscriptionStatus('BILLING.SUBSCRIPTION.CANCELLED')).toBe('CANCELLED');
    expect(mapPayPalEventTypeToSubscriptionStatus('PAYMENT.SALE.COMPLETED')).toBeNull();
  });
});
