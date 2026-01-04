import {
  SubscriptionCreatedSchema,
  SubscriptionDeletedSchema,
  SubscriptionUpdatedSchema,
} from "../contracts/subscription.0";
import { pool } from "../db/pool";

/**
 * Handle subscription.created.0 event
 */
export async function handleSubscriptionCreated(payload: unknown, eventId: string) {
  const validated = SubscriptionCreatedSchema.parse(payload);

  await pool`
    INSERT INTO subscription (
      id, flowcore_event_id, user_id, stripe_customer_id,
      stripe_subscription_id, status, current_period_end, price_id,
      created_at, updated_at
    ) VALUES (
      ${validated.id},
      ${eventId},
      ${validated.userId},
      ${validated.stripeCustomerId ?? null},
      ${validated.stripeSubscriptionId},
      ${validated.status},
      ${validated.currentPeriodEnd ?? null},
      ${validated.priceId ?? null},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      flowcore_event_id = EXCLUDED.flowcore_event_id,
      user_id = EXCLUDED.user_id,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      price_id = EXCLUDED.price_id,
      updated_at = EXCLUDED.updated_at
    WHERE subscription.flowcore_event_id != EXCLUDED.flowcore_event_id
  `;
}

/**
 * Handle subscription.updated.0 event
 */
export async function handleSubscriptionUpdated(payload: unknown, eventId: string) {
  const validated = SubscriptionUpdatedSchema.parse(payload);

  const updates: string[] = [];
  const values: unknown[] = [eventId, validated.id];

  if (validated.userId !== undefined) {
    updates.push(`user_id = $${values.length + 1}`);
    values.push(validated.userId);
  }
  if (validated.stripeCustomerId !== undefined) {
    updates.push(`stripe_customer_id = $${values.length + 1}`);
    values.push(validated.stripeCustomerId);
  }
  if (validated.stripeSubscriptionId !== undefined) {
    updates.push(`stripe_subscription_id = $${values.length + 1}`);
    values.push(validated.stripeSubscriptionId);
  }
  if (validated.status !== undefined) {
    updates.push(`status = $${values.length + 1}`);
    values.push(validated.status);
  }
  if (validated.currentPeriodEnd !== undefined) {
    updates.push(`current_period_end = $${values.length + 1}`);
    values.push(validated.currentPeriodEnd);
  }
  if (validated.priceId !== undefined) {
    updates.push(`price_id = $${values.length + 1}`);
    values.push(validated.priceId);
  }

  if (updates.length === 0) {
    console.warn(`⚠️  No fields to update for subscription ${validated.id}`);
    return;
  }

  updates.push("updated_at = NOW()");

  await pool.unsafe(
    `UPDATE subscription SET ${updates.join(", ")} WHERE id = $${values.length - 1} AND flowcore_event_id != $${values.length}`,
    values as never[]
  );
}

/**
 * Handle subscription.deleted.0 event
 */
export async function handleSubscriptionDeleted(payload: unknown, eventId: string) {
  const validated = SubscriptionDeletedSchema.parse(payload);

  await pool`
    UPDATE subscription
    SET status = 'canceled', updated_at = NOW()
    WHERE id = ${validated.id}
      AND user_id = ${validated.userId}
      AND stripe_subscription_id = ${validated.stripeSubscriptionId}
      AND flowcore_event_id != ${eventId}
  `;
}
