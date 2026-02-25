import { describe, expect, it } from 'vitest';
import { recordWebhookEventIfNew, upsertSubscriptionByPayPalId } from '../src/db';
import type { PayPalWebhookEvent } from '../src/paypal';
import { getPaypalSubscriptionId, handleRequest, syncPaypalSubscriptionEvent } from '../src/router';
import { mapPayPalEventTypeToSubscriptionStatus } from '../src/subscriptionPlans';
import type { Env } from '../src/types';

interface SubscriptionRow {
  user_id: string;
  plan: string;
  status: string;
  paypal_subscription_id: string;
  payer_id: string | null;
  email: string | null;
}

interface SyncedSubscriptionRow {
  id: string;
  user_id: string | null;
  plan_code: string | null;
  status: string;
  paypal_subscription_id: string;
  created_at: string;
  updated_at: string;
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

class SyncFakeD1PreparedStatement {
  private args: unknown[] = [];

  constructor(private readonly sql: string, private readonly state: { subscriptions: SyncedSubscriptionRow[] }) {}

  bind(...args: unknown[]): this {
    this.args = args;
    return this;
  }

  async run(): Promise<{ meta: { changes: number } }> {
    if (!this.sql.includes('INSERT INTO subscriptions')) {
      throw new Error(`Unsupported run SQL in test: ${this.sql}`);
    }

    const [id, userId, planCode, status, paypalSubscriptionId, createdAt, updatedAt, unknownUserId, unknownPlanCode] = this.args as [
      string,
      string | null,
      string | null,
      string,
      string,
      string,
      string,
      string,
      string,
    ];

    const existing = this.state.subscriptions.find((item) => item.id === id);
    if (existing) {
      if (existing.user_id === null || existing.user_id === unknownUserId) {
        existing.user_id = userId;
      }
      if (existing.plan_code === null || existing.plan_code === unknownPlanCode || existing.plan_code === 'PLAN_UNKNOWN') {
        existing.plan_code = planCode;
      }
      existing.status = status;
      existing.paypal_subscription_id = paypalSubscriptionId;
      existing.updated_at = updatedAt;
      return { meta: { changes: 1 } };
    }

    this.state.subscriptions.push({
      id,
      user_id: userId,
      plan_code: planCode,
      status,
      paypal_subscription_id: paypalSubscriptionId,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    return { meta: { changes: 1 } };
  }
}

class SyncFakeD1Database {
  private readonly state = {
    subscriptions: [] as SyncedSubscriptionRow[],
  };

  prepare(sql: string): SyncFakeD1PreparedStatement {
    return new SyncFakeD1PreparedStatement(sql, this.state);
  }

  get subscriptions(): SyncedSubscriptionRow[] {
    return this.state.subscriptions;
  }
}

class RouteFakeD1PreparedStatement {
  private args: unknown[] = [];

  constructor(
    private readonly sql: string,
    private readonly state: { webhookEvents: Set<string>; subscriptions: SyncedSubscriptionRow[] },
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
      const [id, userId, planCode, status, paypalSubscriptionId, createdAt, updatedAt, unknownUserId, unknownPlanCode] = this.args as [
        string,
        string | null,
        string | null,
        string,
        string,
        string,
        string,
        string,
        string,
      ];

      const existing = this.state.subscriptions.find((item) => item.id === id);
      if (existing) {
        if (existing.user_id === null || existing.user_id === unknownUserId) {
          existing.user_id = userId;
        }
        if (existing.plan_code === null || existing.plan_code === unknownPlanCode || existing.plan_code === 'PLAN_UNKNOWN') {
          existing.plan_code = planCode;
        }
        existing.status = status;
        existing.paypal_subscription_id = paypalSubscriptionId;
        existing.updated_at = updatedAt;
        return { meta: { changes: 1 } };
      }

      this.state.subscriptions.push({
        id,
        user_id: userId,
        plan_code: planCode,
        status,
        paypal_subscription_id: paypalSubscriptionId,
        created_at: createdAt,
        updated_at: updatedAt,
      });
      return { meta: { changes: 1 } };
    }

    throw new Error(`Unsupported run SQL in test: ${this.sql}`);
  }
}

class RouteFakeD1Database {
  private readonly state: { webhookEvents: Set<string>; subscriptions: SyncedSubscriptionRow[] };

  constructor(existingEventIds: string[] = []) {
    this.state = {
      webhookEvents: new Set(existingEventIds),
      subscriptions: [],
    };
  }

  prepare(sql: string): RouteFakeD1PreparedStatement {
    return new RouteFakeD1PreparedStatement(sql, this.state);
  }

  get subscriptions(): SyncedSubscriptionRow[] {
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

  it('upsert un webhook CREATED avec resource_type Agreement', async () => {
    const fake = new SyncFakeD1Database();
    const db = fake as unknown as D1Database;
    const event: PayPalWebhookEvent = {
      id: 'WH-1',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource_type: 'Agreement',
      resource: {
        id: 'I-TEST123',
      },
    };

    await syncPaypalSubscriptionEvent(db, event);

    expect(fake.subscriptions).toHaveLength(1);
    expect(fake.subscriptions[0]?.id).toBe('I-TEST123');
    expect(fake.subscriptions[0]?.paypal_subscription_id).toBe('I-TEST123');
    expect(fake.subscriptions[0]?.status).toBe('CREATED');
  });

  it('crée un stub puis enrichit user_id/plan_code sur event suivant', async () => {
    const fake = new SyncFakeD1Database();
    const db = fake as unknown as D1Database;

    await syncPaypalSubscriptionEvent(db, {
      id: 'WH-CREATED-1',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource_type: 'Agreement',
      resource: {
        id: 'I-TEST123',
      },
    });

    expect(fake.subscriptions).toHaveLength(1);
    expect(fake.subscriptions[0]?.id).toBe('I-TEST123');
    expect(fake.subscriptions[0]?.user_id).toBe('__unknown__');
    expect(fake.subscriptions[0]?.plan_code).toBe('UNKNOWN');
    expect(fake.subscriptions[0]?.status).toBe('CREATED');

    await syncPaypalSubscriptionEvent(db, {
      id: 'WH-ACTIVATED-1',
      event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
      resource_type: 'Agreement',
      resource: {
        id: 'I-TEST123',
        custom_id: 'user_123',
        plan_id: 'PREMIUM_SANDBOX_PLAN_ID',
      },
    });

    expect(fake.subscriptions).toHaveLength(1);
    expect(fake.subscriptions[0]?.id).toBe('I-TEST123');
    expect(fake.subscriptions[0]?.user_id).toBe('user_123');
    expect(fake.subscriptions[0]?.plan_code).toBe('PREMIUM_MONTHLY');
    expect(fake.subscriptions[0]?.status).toBe('ACTIVE');
  });

  it('extrait paypalSubscriptionId avec fallback billing_agreement_id/subscription_id', () => {
    expect(
      getPaypalSubscriptionId({
        id: 'WH-2',
        event_type: 'BILLING.SUBSCRIPTION.CREATED',
        resource: { id: 'I-ID-FIRST', billing_agreement_id: 'I-ID-SECOND', subscription_id: 'I-ID-THIRD' },
      }),
    ).toBe('I-ID-FIRST');

    expect(
      getPaypalSubscriptionId({
        id: 'WH-3',
        event_type: 'BILLING.SUBSCRIPTION.CREATED',
        resource: { billing_agreement_id: 'I-ID-SECOND', subscription_id: 'I-ID-THIRD' },
      }),
    ).toBe('I-ID-SECOND');

    expect(
      getPaypalSubscriptionId({
        id: 'WH-4',
        event_type: 'BILLING.SUBSCRIPTION.CREATED',
        resource: { subscription_id: 'I-ID-THIRD' },
      }),
    ).toBe('I-ID-THIRD');

    expect(
      getPaypalSubscriptionId({
        id: 'WH-5',
        event_type: 'BILLING.SUBSCRIPTION.CREATED',
        resource: { id: 'NOT-VALID' },
      }),
    ).toBeNull();
  });

  it('mappe correctement event_type PayPal vers status interne', () => {
    expect(mapPayPalEventTypeToSubscriptionStatus('BILLING.SUBSCRIPTION.CREATED')).toBe('CREATED');
    expect(mapPayPalEventTypeToSubscriptionStatus('BILLING.SUBSCRIPTION.ACTIVATED')).toBe('ACTIVE');
    expect(mapPayPalEventTypeToSubscriptionStatus('BILLING.SUBSCRIPTION.SUSPENDED')).toBe('SUSPENDED');
    expect(mapPayPalEventTypeToSubscriptionStatus('BILLING.SUBSCRIPTION.CANCELLED')).toBe('CANCELLED');
    expect(mapPayPalEventTypeToSubscriptionStatus('PAYMENT.SALE.COMPLETED')).toBeNull();
  });

  it('resynchronise subscriptions même sur duplicate_event', async () => {
    const duplicateEventId = 'WH-DUPLICATE-1';
    const fakeDb = new RouteFakeD1Database([duplicateEventId]);
    const env = {
      PRICE_DB: fakeDb as unknown as D1Database,
      PRICE_ADMIN_TOKEN: 'admin-token',
      PAYPAL_CLIENT_ID: 'paypal-client-id',
      PAYPAL_CLIENT_SECRET: 'paypal-client-secret',
      PAYPAL_WEBHOOK_ID: 'paypal-webhook-id',
      PAYPAL_ENV: 'sandbox',
      PRICE_IMPORTS: {} as R2Bucket,
    } as Env;

    const event: PayPalWebhookEvent = {
      id: duplicateEventId,
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource_type: 'Agreement',
      resource: {
        id: 'I-DUPLICATE-123',
      },
    };

    const response = await handleRequest(
      new Request('https://example.com/v1/webhooks/paypal', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      env,
      {
        waitUntil: () => {
          // no-op for test
        },
        passThroughOnException: () => {
          // no-op for test
        },
        props: {},
      } as unknown as ExecutionContext,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ignored', reason: 'duplicate_event' });
    expect(fakeDb.subscriptions).toHaveLength(1);
    expect(fakeDb.subscriptions[0]?.id).toBe('I-DUPLICATE-123');
    expect(fakeDb.subscriptions[0]?.status).toBe('CREATED');
  });
});
