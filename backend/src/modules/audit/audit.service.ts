import { logger } from "../../config/logger";
import { auditRepository } from "./audit.repository";
import type {
  AuditLogListResult,
  AuditLogQuery,
  AuditLogRecord,
  CreateAuditLogParams,
  FormattedAuditLog
} from "./audit.types";

function cleanIp(rawIp?: string | null): string | null {
  if (!rawIp) return null;
  const cleaned = rawIp.replace(/^::ffff:/, "").split(",")[0].trim();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleaned) || cleaned.includes(":")) {
    return cleaned;
  }
  return null;
}

function isValidUuid(id?: string | null): string | null {
  if (!id) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return isoString;
  }
}

function formatAuditLog(row: AuditLogRecord): FormattedAuditLog {
  const actorName = row.actor_name_snapshot || (row.actor_user_id ? "Admin User" : "System / Guest");
  
  let displayAction = row.action;
  let entityType = row.entity_type;

  if (displayAction === "auth.login_success") {
    displayAction = "Admin Login";
    if (!entityType) entityType = "auth";
  } else if (displayAction === "auth.login_failed") {
    displayAction = "Login Failed";
    if (!entityType) entityType = "auth";
  } else if (displayAction === "auth.login_forbidden") {
    displayAction = "Login Forbidden";
    if (!entityType) entityType = "auth";
  } else if (displayAction === "auth.logout") {
    displayAction = "Admin Logout";
    if (!entityType) entityType = "auth";
  } else if (displayAction === "auth.revoke_all_sessions") {
    displayAction = "Revoked All Sessions";
    if (!entityType) entityType = "auth";
  } else if (displayAction === "destination.created") {
    displayAction = "Created Destination";
    if (!entityType) entityType = "destination";
  } else if (displayAction === "destination.updated") {
    displayAction = "Updated Destination";
    if (!entityType) entityType = "destination";
  } else if (displayAction === "destination.archived") {
    displayAction = "Archived Destination";
    if (!entityType) entityType = "destination";
  } else if (displayAction === "destination.unarchived") {
    displayAction = "Restored Destination";
    if (!entityType) entityType = "destination";
  }

  return {
    id: row.id,
    userId: row.actor_user_id,
    user: actorName,
    action: displayAction,
    entityType,
    entityId: row.entity_id,
    details: row.details || "",
    beforeData: row.before_data,
    afterData: row.after_data,
    ip: row.ip_address || "—",
    userAgent: row.user_agent,
    date: formatDate(row.created_at),
    createdAt: row.created_at
  };
}

export const auditService = {
  /**
   * Safely record an audit log. Does not throw if writing fails,
   * ensuring primary business operations always succeed.
   */
  async recordLog(params: CreateAuditLogParams): Promise<void> {
    try {
      let actorUserId = params.actorUserId ?? null;
      let actorNameSnapshot = params.actorNameSnapshot ?? null;
      let ipAddress = cleanIp(params.ipAddress);
      let userAgent = params.userAgent ?? null;

      // Automatically inspect Express req object if passed
      if (params.req) {
        const req = params.req;
        if (!actorUserId && req.user?.id) {
          actorUserId = req.user.id;
        }
        if (!actorNameSnapshot) {
          actorNameSnapshot = req.user?.fullName || req.user?.email || null;
        }
        if (!ipAddress) {
          const forwarded = req.headers?.["x-forwarded-for"];
          const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip;
          ipAddress = cleanIp(rawIp);
        }
        if (!userAgent && req.headers?.["user-agent"]) {
          userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null;
        }
      }

      const entityId = isValidUuid(params.entityId);

      await auditRepository.insertLog({
        actorUserId,
        actorNameSnapshot,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId,
        details: params.details ?? null,
        beforeData: params.beforeData ?? null,
        afterData: params.afterData ?? null,
        ipAddress,
        userAgent
      });
    } catch (error) {
      logger.warn({ error, action: params.action }, "Failed to persist audit log (non-fatal)");
    }
  },

  async listLogs(query: AuditLogQuery): Promise<AuditLogListResult> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const { rows, total } = await auditRepository.findMany({
      search: query.search,
      action: query.action,
      entityType: query.entityType,
      fromDate: query.fromDate,
      toDate: query.toDate,
      page,
      limit
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const logs = rows.map(formatAuditLog);

    return {
      logs,
      total,
      page,
      limit,
      totalPages
    };
  }
};

/**
 * Convenient shorthand helper to record audit logs from anywhere in the codebase.
 */
export const recordAuditLog = auditService.recordLog;
