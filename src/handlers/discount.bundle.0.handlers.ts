import {
  DiscountBundleDeletedSchema,
  DiscountBundlePurchasedSchema,
  DiscountBundleUpdatedSchema,
} from "../contracts/discount.bundle.0";
import { pool } from "../db/pool";

/**
 * Handle discount.bundle.purchased.0 event
 */
export async function handleDiscountBundlePurchased(payload: unknown, eventId: string) {
  const validated = DiscountBundlePurchasedSchema.parse(payload);

  await pool`
    INSERT INTO discount_bundle (
      id, flowcore_event_id, club_name, purchased_by,
      stripe_invoice_id, status, code_count, price_amount,
      code_ids, created_at, updated_at
    ) VALUES (
      ${validated.id},
      ${eventId},
      ${validated.clubName},
      ${validated.purchasedBy},
      ${validated.stripeInvoiceId ?? null},
      ${validated.status},
      ${validated.codeCount},
      ${validated.priceAmount},
      ${validated.codeIds},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      flowcore_event_id = EXCLUDED.flowcore_event_id,
      club_name = EXCLUDED.club_name,
      purchased_by = EXCLUDED.purchased_by,
      stripe_invoice_id = EXCLUDED.stripe_invoice_id,
      status = EXCLUDED.status,
      code_count = EXCLUDED.code_count,
      price_amount = EXCLUDED.price_amount,
      code_ids = EXCLUDED.code_ids,
      updated_at = EXCLUDED.updated_at
    WHERE discount_bundle.flowcore_event_id != EXCLUDED.flowcore_event_id
  `;
}

/**
 * Handle discount.bundle.updated.0 event
 */
export async function handleDiscountBundleUpdated(payload: unknown, eventId: string) {
  const validated = DiscountBundleUpdatedSchema.parse(payload);

  // Build update query dynamically
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];

  if (validated.clubName !== undefined) {
    updateFields.push(`club_name = $${updateValues.length + 1}`);
    updateValues.push(validated.clubName);
  }
  if (validated.stripeInvoiceId !== undefined) {
    updateFields.push(`stripe_invoice_id = $${updateValues.length + 1}`);
    updateValues.push(validated.stripeInvoiceId);
  }
  if (validated.status !== undefined) {
    updateFields.push(`status = $${updateValues.length + 1}`);
    updateValues.push(validated.status);
  }
  if (validated.codeCount !== undefined) {
    updateFields.push(`code_count = $${updateValues.length + 1}`);
    updateValues.push(validated.codeCount);
  }
  if (validated.priceAmount !== undefined) {
    updateFields.push(`price_amount = $${updateValues.length + 1}`);
    updateValues.push(validated.priceAmount);
  }
  if (validated.codeIds !== undefined) {
    updateFields.push(`code_ids = $${updateValues.length + 1}::uuid[]`);
    updateValues.push(validated.codeIds);
  }

  if (updateFields.length === 0) {
    console.warn(`⚠️  No fields to update for discount bundle ${validated.id}`);
    return;
  }

  updateFields.push("updated_at = NOW()");
  updateValues.push(validated.id, eventId);

  // Use postgres template literal with SQL.unsafe for dynamic queries
  await pool.unsafe(
    `UPDATE discount_bundle SET ${updateFields.join(", ")} WHERE id = $${updateValues.length - 1} AND flowcore_event_id != $${updateValues.length}`,
    updateValues as never[]
  );
}

/**
 * Handle discount.bundle.deleted.0 event
 */
export async function handleDiscountBundleDeleted(payload: unknown, eventId: string) {
  const validated = DiscountBundleDeletedSchema.parse(payload);

  await pool`
    DELETE FROM discount_bundle
    WHERE id = ${validated.id}
  `;
}
