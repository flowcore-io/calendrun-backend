import {
  DiscountCodeCreatedSchema,
  DiscountCodeDeletedSchema,
  DiscountCodeRedeemedSchema,
  DiscountCodeUpdatedSchema,
} from "../contracts/discount.code.0";
import { pool } from "../db/pool";

/**
 * Handle discount.code.created.0 event
 */
export async function handleDiscountCodeCreated(payload: unknown, eventId: string) {
  const validated = DiscountCodeCreatedSchema.parse(payload);

  // Map frontend discountType to database format
  const dbDiscountType =
    validated.discountType === "full"
      ? "percentage"
      : validated.discountType === "fixed"
        ? "fixed_amount"
        : validated.discountType;

  await pool`
    INSERT INTO discount_code (
      id, flowcore_event_id, code, bundle_id, discount_type,
      discount_value, max_uses, used_count, expires_at,
      redeemed_by, created_at, updated_at
    ) VALUES (
      ${validated.id},
      ${eventId},
      ${validated.code},
      ${validated.bundleId ?? null},
      ${dbDiscountType},
      ${validated.discountValue},
      ${validated.maxUses},
      ${validated.usedCount},
      ${validated.expiresAt ? validated.expiresAt : null}::timestamp,
      ${validated.redeemedBy.length > 0 ? (validated.redeemedBy[0] ?? null) : null},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      flowcore_event_id = EXCLUDED.flowcore_event_id,
      code = EXCLUDED.code,
      bundle_id = EXCLUDED.bundle_id,
      discount_type = EXCLUDED.discount_type,
      discount_value = EXCLUDED.discount_value,
      max_uses = EXCLUDED.max_uses,
      used_count = EXCLUDED.used_count,
      expires_at = EXCLUDED.expires_at,
      redeemed_by = EXCLUDED.redeemed_by,
      updated_at = EXCLUDED.updated_at
    WHERE discount_code.flowcore_event_id != EXCLUDED.flowcore_event_id
  `;
}

/**
 * Handle discount.code.updated.0 event
 */
export async function handleDiscountCodeUpdated(payload: unknown, eventId: string) {
  const validated = DiscountCodeUpdatedSchema.parse(payload);

  // Build update query dynamically
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];

  if (validated.bundleId !== undefined) {
    updateFields.push(`bundle_id = $${updateValues.length + 1}`);
    updateValues.push(validated.bundleId);
  }
  if (validated.discountType !== undefined) {
    const dbDiscountType =
      validated.discountType === "full"
        ? "percentage"
        : validated.discountType === "fixed"
          ? "fixed_amount"
          : validated.discountType;
    updateFields.push(`discount_type = $${updateValues.length + 1}`);
    updateValues.push(dbDiscountType);
  }
  if (validated.discountValue !== undefined) {
    updateFields.push(`discount_value = $${updateValues.length + 1}`);
    updateValues.push(validated.discountValue);
  }
  if (validated.maxUses !== undefined) {
    updateFields.push(`max_uses = $${updateValues.length + 1}`);
    updateValues.push(validated.maxUses);
  }
  if (validated.usedCount !== undefined) {
    updateFields.push(`used_count = $${updateValues.length + 1}`);
    updateValues.push(validated.usedCount);
  }
  if (validated.expiresAt !== undefined) {
    updateFields.push(`expires_at = $${updateValues.length + 1}::timestamp`);
    updateValues.push(validated.expiresAt);
  }
  if (validated.redeemedBy !== undefined && validated.redeemedBy.length > 0) {
    const firstUser = validated.redeemedBy[0];
    if (firstUser) {
      updateFields.push(`redeemed_by = $${updateValues.length + 1}`);
      updateValues.push(firstUser); // Store first user only (DB limitation)
    }
  }

  if (updateFields.length === 0) {
    console.warn(`⚠️  No fields to update for discount code ${validated.id}`);
    return;
  }

  updateFields.push("updated_at = NOW()");
  updateValues.push(validated.id, eventId);

  // Use postgres template literal with SQL.unsafe for dynamic queries
  await pool.unsafe(
    `UPDATE discount_code SET ${updateFields.join(", ")} WHERE id = $${updateValues.length - 1} AND flowcore_event_id != $${updateValues.length}`,
    updateValues as never[]
  );
}

/**
 * Handle discount.code.deleted.0 event
 */
export async function handleDiscountCodeDeleted(payload: unknown, eventId: string) {
  const validated = DiscountCodeDeletedSchema.parse(payload);

  await pool`
    DELETE FROM discount_code
    WHERE id = ${validated.id}
  `;
}

/**
 * Handle discount.code.redeemed.0 event
 */
export async function handleDiscountCodeRedeemed(payload: unknown, eventId: string) {
  const validated = DiscountCodeRedeemedSchema.parse(payload);

  await pool`
    UPDATE discount_code
    SET
      used_count = used_count + 1,
      redeemed_by = ${validated.userId},
      updated_at = NOW()
    WHERE id = ${validated.id}
      AND flowcore_event_id != ${eventId}
  `;
}
