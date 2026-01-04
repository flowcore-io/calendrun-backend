import { UserSettingsUpdatedSchema } from "../contracts/user.settings.0";
import { pool } from "../db/pool";

/**
 * Handle user.settings.updated.0 event
 */
export async function handleUserSettingsUpdated(payload: unknown, eventId: string) {
  const validated = UserSettingsUpdatedSchema.parse(payload);

  await pool`
    INSERT INTO user_settings (
      id, user_id, flowcore_event_id, preferences, created_at, updated_at
    ) VALUES (
      ${validated.id},
      ${validated.userId},
      ${eventId},
      ${JSON.stringify(validated.preferences)},
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      preferences = EXCLUDED.preferences,
      updated_at = NOW(),
      flowcore_event_id = EXCLUDED.flowcore_event_id
    WHERE user_settings.flowcore_event_id != EXCLUDED.flowcore_event_id
  `;
}
