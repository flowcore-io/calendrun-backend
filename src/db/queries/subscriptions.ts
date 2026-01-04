import { pool } from "../pool";

export async function getSubscriptionByUserId(userId: string) {
  const result = await pool`
    SELECT * FROM subscription
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return result[0] ?? null;
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const result = await pool`
    SELECT * FROM subscription
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
    LIMIT 1
  `;
  return result[0] ?? null;
}
