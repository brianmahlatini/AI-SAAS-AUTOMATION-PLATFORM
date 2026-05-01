import { pgPool } from "../../database/postgres";

export type SubscriptionPlan = "FREE" | "PRO" | "ENTERPRISE";

export type SubscriptionRecord = {
  ownerId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: string;
  currentPeriodEnd?: string;
};

export async function getSubscription(ownerId: string): Promise<SubscriptionRecord> {
  const result = await pgPool.query(
    `
      SELECT owner_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end
      FROM subscriptions
      WHERE owner_id = $1
    `,
    [ownerId]
  );

  const row = result.rows[0];
  if (!row) {
    return {
      ownerId,
      plan: "FREE",
      status: "inactive"
    };
  }

  return {
    ownerId: row.owner_id,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end?.toISOString()
  };
}

export async function upsertSubscription(input: SubscriptionRecord): Promise<SubscriptionRecord> {
  const result = await pgPool.query(
    `
      INSERT INTO subscriptions (
        owner_id,
        stripe_customer_id,
        stripe_subscription_id,
        plan,
        status,
        current_period_end,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (owner_id) DO UPDATE SET
        stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, subscriptions.stripe_subscription_id),
        plan = EXCLUDED.plan,
        status = EXCLUDED.status,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW()
      RETURNING owner_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end
    `,
    [
      input.ownerId,
      input.stripeCustomerId ?? null,
      input.stripeSubscriptionId ?? null,
      input.plan,
      input.status,
      input.currentPeriodEnd ?? null
    ]
  );

  const row = result.rows[0];
  return {
    ownerId: row.owner_id,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end?.toISOString()
  };
}

export async function findOwnerByStripeCustomer(customerId: string): Promise<string | null> {
  const result = await pgPool.query(
    "SELECT owner_id FROM subscriptions WHERE stripe_customer_id = $1 LIMIT 1",
    [customerId]
  );
  return result.rows[0]?.owner_id ?? null;
}

export async function countSubscriptions(): Promise<number> {
  const result = await pgPool.query(
    "SELECT COUNT(*)::int AS count FROM subscriptions WHERE status IN ('active', 'trialing')"
  );
  return result.rows[0]?.count ?? 0;
}
