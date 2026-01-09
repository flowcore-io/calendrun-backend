import { RunDeletedSchema, RunLoggedSchema, RunUpdatedSchema } from "../contracts/run.0";
import { pool } from "../db/pool";
import { getTableName } from "../db/table-names";

/**
 * Handle run.logged.0 event
 */
export async function handleRunLogged(payload: unknown, eventId: string) {
  const validated = RunLoggedSchema.parse(payload);

  // Normalize runDate to date-only format
  const runDate = validated.runDate.includes("T")
    ? (validated.runDate.split("T")[0] ?? validated.runDate)
    : validated.runDate;

  // Normalize actualRunDate to date-only format, or use created_at date if not provided
  let actualRunDate: string | null = null;
  if (validated.actualRunDate) {
    actualRunDate = validated.actualRunDate.includes("T")
      ? (validated.actualRunDate.split("T")[0] ?? validated.actualRunDate)
      : validated.actualRunDate;
  }
  // If not provided, will use DATE(NOW()) in the INSERT

  // Get current date for fallback in performance_log
  const createdTimestamp = new Date().toISOString();
  const createdDate = createdTimestamp.split("T")[0] ?? createdTimestamp;

  const performanceTable = getTableName("performance");
  const performanceLogTable = getTableName("performance_log");

  // Use COALESCE to fallback to DATE(NOW()) if actualRunDate is null
  if (actualRunDate) {
    await pool.unsafe(
      `INSERT INTO ${performanceTable} (
        id, flowcore_event_id, instance_id, user_id, runner_name,
        run_date, actual_run_date, distance_km, time_minutes, notes, status,
        recorded_at, change_log, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        flowcore_event_id = EXCLUDED.flowcore_event_id,
        instance_id = EXCLUDED.instance_id,
        user_id = EXCLUDED.user_id,
        runner_name = EXCLUDED.runner_name,
        run_date = EXCLUDED.run_date,
        actual_run_date = EXCLUDED.actual_run_date,
        distance_km = EXCLUDED.distance_km,
        time_minutes = EXCLUDED.time_minutes,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        recorded_at = EXCLUDED.recorded_at,
        change_log = EXCLUDED.change_log,
        updated_at = NOW()
      WHERE ${performanceTable}.flowcore_event_id != EXCLUDED.flowcore_event_id`,
      [
        validated.id,
        eventId,
        validated.instanceId,
        validated.userId,
        validated.runnerName ?? null,
        runDate,
        actualRunDate,
        validated.distanceKm,
        validated.timeMinutes ?? null,
        validated.notes ?? null,
        validated.status,
        validated.recordedAt ?? null,
        validated.changeLog ? JSON.stringify(validated.changeLog) : null,
      ]
    );
  } else {
    await pool.unsafe(
      `INSERT INTO ${performanceTable} (
        id, flowcore_event_id, instance_id, user_id, runner_name,
        run_date, actual_run_date, distance_km, time_minutes, notes, status,
        recorded_at, change_log, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, DATE(NOW()), $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        flowcore_event_id = EXCLUDED.flowcore_event_id,
        instance_id = EXCLUDED.instance_id,
        user_id = EXCLUDED.user_id,
        runner_name = EXCLUDED.runner_name,
        run_date = EXCLUDED.run_date,
        actual_run_date = COALESCE(EXCLUDED.actual_run_date, DATE(${performanceTable}.created_at)),
        distance_km = EXCLUDED.distance_km,
        time_minutes = EXCLUDED.time_minutes,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        recorded_at = EXCLUDED.recorded_at,
        change_log = EXCLUDED.change_log,
        updated_at = NOW()
      WHERE ${performanceTable}.flowcore_event_id != EXCLUDED.flowcore_event_id`,
      [
        validated.id,
        eventId,
        validated.instanceId,
        validated.userId,
        validated.runnerName ?? null,
        runDate,
        validated.distanceKm,
        validated.timeMinutes ?? null,
        validated.notes ?? null,
        validated.status,
        validated.recordedAt ?? null,
        validated.changeLog ? JSON.stringify(validated.changeLog) : null,
      ]
    );
  }

  // Log to performance_log table
  await pool.unsafe(
    `INSERT INTO ${performanceLogTable} (
      flowcore_event_id, event_type, performance_id, instance_id, user_id,
      runner_name, run_date, actual_run_date, distance_km, time_minutes, notes, status,
      recorded_at, change_log, event_payload
    ) VALUES ($1, 'run.logged.0', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (flowcore_event_id) DO NOTHING`,
    [
      eventId,
      validated.id,
      validated.instanceId,
      validated.userId,
      validated.runnerName ?? null,
      runDate,
      actualRunDate ?? createdDate,
      validated.distanceKm,
      validated.timeMinutes ?? null,
      validated.notes ?? null,
      validated.status,
      validated.recordedAt ?? null,
      validated.changeLog ? JSON.stringify(validated.changeLog) : null,
      JSON.stringify(validated),
    ]
  );
}

/**
 * Handle run.updated.0 event
 */
export async function handleRunUpdated(payload: unknown, eventId: string) {
  const validated = RunUpdatedSchema.parse(payload);

  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const values: unknown[] = [eventId, validated.id];

  if (validated.runnerName !== undefined) {
    updates.push(`runner_name = $${values.length + 1}`);
    values.push(validated.runnerName);
  }
  if (validated.runDate !== undefined) {
    const runDate = validated.runDate.includes("T")
      ? (validated.runDate.split("T")[0] ?? validated.runDate)
      : validated.runDate;
    updates.push(`run_date = $${values.length + 1}`);
    values.push(runDate);
  }
  if (validated.actualRunDate !== undefined) {
    const actualRunDate = validated.actualRunDate.includes("T")
      ? (validated.actualRunDate.split("T")[0] ?? validated.actualRunDate)
      : validated.actualRunDate;
    updates.push(`actual_run_date = $${values.length + 1}`);
    values.push(actualRunDate);
  }
  if (validated.distanceKm !== undefined) {
    updates.push(`distance_km = $${values.length + 1}`);
    values.push(validated.distanceKm);
  }
  if (validated.timeMinutes !== undefined) {
    updates.push(`time_minutes = $${values.length + 1}`);
    values.push(validated.timeMinutes);
  }
  if (validated.notes !== undefined) {
    updates.push(`notes = $${values.length + 1}`);
    values.push(validated.notes);
  }
  if (validated.status !== undefined) {
    updates.push(`status = $${values.length + 1}`);
    values.push(validated.status);
  }
  if (validated.recordedAt !== undefined) {
    updates.push(`recorded_at = $${values.length + 1}`);
    values.push(validated.recordedAt);
  }
  if (validated.changeLog !== undefined) {
    updates.push(`change_log = $${values.length + 1}`);
    values.push(JSON.stringify(validated.changeLog));
  }

  if (updates.length === 0) {
    console.warn(`⚠️  No fields to update for run ${validated.id}`);
    return;
  }

  updates.push("updated_at = NOW()");

  const performanceTable = getTableName("performance");
  const performanceLogTable = getTableName("performance_log");

  // values array structure: [eventId, validated.id, ...updates]
  // So WHERE clause should use $2 for id and $1 for eventId
  await pool.unsafe(
    `UPDATE ${performanceTable} SET ${updates.join(", ")} WHERE id = $2 AND flowcore_event_id != $1`,
    values as never[]
  );

  // Get current performance data for logging
  const currentPerformance = await pool.unsafe(
    `SELECT * FROM ${performanceTable} WHERE id = $1 LIMIT 1`,
    [validated.id]
  );

  if (currentPerformance.length > 0) {
    const perf = currentPerformance[0];
    
    // Determine actual_run_date: use from payload if provided, otherwise from existing record, otherwise from created_at
    let actualRunDate: string | null = null;
    if (validated.actualRunDate !== undefined) {
      actualRunDate = validated.actualRunDate.includes("T")
        ? (validated.actualRunDate.split("T")[0] ?? validated.actualRunDate)
        : validated.actualRunDate;
    } else if (perf.actual_run_date !== undefined && perf.actual_run_date !== null) {
      actualRunDate = perf.actual_run_date;
    } else if (perf.created_at) {
      // Extract date portion from created_at timestamp
      const createdDate = new Date(perf.created_at);
      actualRunDate = createdDate.toISOString().split("T")[0] ?? null;
    }
    
    // Log to performance_log table
    const runDateForLog = perf.run_date ?? (validated.runDate ? (validated.runDate.includes("T") ? validated.runDate.split("T")[0] : validated.runDate) : null);
    await pool.unsafe(
      `INSERT INTO ${performanceLogTable} (
        flowcore_event_id, event_type, performance_id, instance_id, user_id,
        runner_name, run_date, actual_run_date, distance_km, time_minutes, notes, status,
        recorded_at, change_log, event_payload
      ) VALUES ($1, 'run.updated.0', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (flowcore_event_id) DO NOTHING`,
      [
        eventId,
        validated.id,
        validated.instanceId,
        validated.userId,
        perf.runner_name ?? validated.runnerName ?? null,
        runDateForLog,
        actualRunDate,
        perf.distance_km ?? validated.distanceKm ?? null,
        perf.time_minutes ?? validated.timeMinutes ?? null,
        perf.notes ?? validated.notes ?? null,
        perf.status ?? validated.status ?? null,
        perf.recorded_at ?? validated.recordedAt ?? null,
        perf.change_log ?? (validated.changeLog ? JSON.stringify(validated.changeLog) : null),
        JSON.stringify(validated),
      ]
    );
  }
}

/**
 * Handle run.deleted.0 event (hard delete)
 * Deletes the performance record entirely, as deletion means the run never happened.
 */
export async function handleRunDeleted(payload: unknown, eventId: string) {
  const validated = RunDeletedSchema.parse(payload);
  const performanceTable = getTableName("performance");
  const performanceLogTable = getTableName("performance_log");

  // Get performance data before deletion for logging
  const performanceToDelete = await pool.unsafe(
    `SELECT * FROM ${performanceTable}
    WHERE id = $1
      AND instance_id = $2
      AND user_id = $3
    LIMIT 1`,
    [validated.id, validated.instanceId, validated.userId]
  );

  await pool.unsafe(
    `DELETE FROM ${performanceTable}
    WHERE id = $1
      AND instance_id = $2
      AND user_id = $3
      AND flowcore_event_id != $4`,
    [validated.id, validated.instanceId, validated.userId, eventId]
  );

  // Always log deletion events to performance_log table for audit purposes
  // Even if the performance didn't exist, we want to record that a deletion was attempted
  if (performanceToDelete.length > 0) {
    const perf = performanceToDelete[0];
    await pool.unsafe(
      `INSERT INTO ${performanceLogTable} (
        flowcore_event_id, event_type, performance_id, instance_id, user_id,
        runner_name, run_date, actual_run_date, distance_km, time_minutes, notes, status,
        recorded_at, change_log, event_payload
      ) VALUES ($1, 'run.deleted.0', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (flowcore_event_id) DO NOTHING`,
      [
        eventId,
        validated.id,
        validated.instanceId,
        validated.userId,
        perf.runner_name ?? null,
        perf.run_date ?? null,
        perf.actual_run_date ?? null,
        perf.distance_km ?? null,
        perf.time_minutes ?? null,
        perf.notes ?? null,
        perf.status ?? null,
        perf.recorded_at ?? null,
        perf.change_log ?? null,
        JSON.stringify(validated),
      ]
    );
  } else {
    // Log deletion event even if performance didn't exist (for audit trail)
    await pool.unsafe(
      `INSERT INTO ${performanceLogTable} (
        flowcore_event_id, event_type, performance_id, instance_id, user_id,
        runner_name, run_date, actual_run_date, distance_km, time_minutes, notes, status,
        recorded_at, change_log, event_payload
      ) VALUES ($1, 'run.deleted.0', $2, $3, $4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, $5)
      ON CONFLICT (flowcore_event_id) DO NOTHING`,
      [eventId, validated.id, validated.instanceId, validated.userId, JSON.stringify(validated)]
    );
  }
}
