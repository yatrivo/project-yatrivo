import { query } from "../../db/postgres";
import type { AuditLogQuery, AuditLogRecord } from "./audit.types";

export const auditRepository = {
  async insertLog(params: {
    actorUserId: string | null;
    actorNameSnapshot: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    details: string | null;
    beforeData: any | null;
    afterData: any | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<AuditLogRecord> {
    const result = await query<AuditLogRecord>(
      `INSERT INTO audit_logs (
        actor_user_id, actor_name_snapshot, action, entity_type, entity_id,
        details, before_data, after_data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        params.actorUserId,
        params.actorNameSnapshot,
        params.action,
        params.entityType,
        params.entityId,
        params.details,
        params.beforeData ? JSON.stringify(params.beforeData) : null,
        params.afterData ? JSON.stringify(params.afterData) : null,
        params.ipAddress,
        params.userAgent
      ]
    );
    return result.rows[0];
  },

  async findMany(params: AuditLogQuery): Promise<{ rows: AuditLogRecord[]; total: number }> {
    const conditions: string[] = [
      // Exclude developer/technical token refresh noise from system logs
      `action NOT IN ('auth.token_refreshed', 'auth.token_reuse_detected', 'Session Refreshed')`,
      `(details IS NULL OR details NOT ILIKE '%token rotated%')`
    ];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      conditions.push(`(
        actor_name_snapshot ILIKE $${paramIndex}
        OR action ILIKE $${paramIndex}
        OR details ILIKE $${paramIndex}
        OR entity_type ILIKE $${paramIndex}
      )`);
      values.push(s);
      paramIndex++;
    }

    if (params.action && params.action.trim() && params.action !== "all") {
      conditions.push(`action ILIKE $${paramIndex}`);
      values.push(`%${params.action.trim()}%`);
      paramIndex++;
    }

    if (params.entityType && params.entityType.trim() && params.entityType !== "all") {
      conditions.push(`entity_type = $${paramIndex}`);
      values.push(params.entityType.trim());
      paramIndex++;
    }

    if (params.fromDate && params.fromDate.trim()) {
      conditions.push(`created_at >= $${paramIndex}::timestamptz`);
      values.push(`${params.fromDate.trim()}T00:00:00.000Z`);
      paramIndex++;
    }

    if (params.toDate && params.toDate.trim()) {
      conditions.push(`created_at <= $${paramIndex}::timestamptz`);
      values.push(`${params.toDate.trim()}T23:59:59.999Z`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countSql = `SELECT count(*)::int AS count FROM audit_logs ${whereClause}`;
    const countResult = await query<{ count: number }>(countSql, values);
    const total = countResult.rows[0]?.count ?? 0;

    // Data query
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const dataSql = `
      SELECT id, actor_user_id, actor_name_snapshot, action, entity_type, entity_id,
             details, before_data, after_data, ip_address, user_agent, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataValues = [...values, limit, offset];
    const dataResult = await query<AuditLogRecord>(dataSql, dataValues);

    return {
      rows: dataResult.rows,
      total
    };
  }
};
