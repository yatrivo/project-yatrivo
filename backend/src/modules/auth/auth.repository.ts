import type { PoolClient, QueryResultRow } from "pg";
import { query } from "../../db/postgres";
import type {
  PasswordResetTokenRecord,
  RefreshTokenRecord,
  UserAuthIdentityRecord,
  UserRecord
} from "./auth.types";

type QueryExecutor = {
  query<T extends QueryResultRow = QueryResultRow>(text: string, params?: readonly unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
};

function getExecutor(client?: PoolClient): QueryExecutor {
  if (client) {
    return {
      query: (text, params) => client.query(text, params ? [...params] : undefined)
    };
  }
  return {
    query: (text, params) => query(text, params)
  };
}

export const authRepository = {
  async findUserByEmail(email: string, client?: PoolClient): Promise<UserRecord | null> {
    const executor = getExecutor(client);
    const result = await executor.query<UserRecord>(
      `SELECT id, full_name, email, phone, avatar_media_id, role, status,
              password_hash, must_change_password, email_verified_at, phone_verified_at, last_login_at,
              invited_by_user_id, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findUserById(id: string, client?: PoolClient): Promise<UserRecord | null> {
    const executor = getExecutor(client);
    const result = await executor.query<UserRecord>(
      `SELECT id, full_name, email, phone, avatar_media_id, role, status,
              password_hash, must_change_password, email_verified_at, phone_verified_at, last_login_at,
              invited_by_user_id, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async updateUserLastLogin(userId: string, client?: PoolClient): Promise<void> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE users
       SET last_login_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  },

  async createRefreshToken(
    params: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      userAgent?: string | null;
      ipAddress?: string | null;
    },
    client?: PoolClient
  ): Promise<RefreshTokenRecord> {
    const executor = getExecutor(client);
    const result = await executor.query<RefreshTokenRecord>(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, token_hash, user_agent, ip_address, expires_at, revoked_at, created_at`,
      [params.userId, params.tokenHash, params.expiresAt, params.userAgent || null, params.ipAddress || null]
    );
    return result.rows[0];
  },

  async findRefreshTokenByHash(tokenHash: string, client?: PoolClient): Promise<RefreshTokenRecord | null> {
    const executor = getExecutor(client);
    const result = await executor.query<RefreshTokenRecord>(
      `SELECT id, user_id, token_hash, user_agent, ip_address, expires_at, revoked_at, created_at
       FROM refresh_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );
    return result.rows[0] || null;
  },

  async revokeRefreshToken(id: string, client?: PoolClient): Promise<void> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE id = $1 AND revoked_at IS NULL`,
      [id]
    );
  },

  async revokeRefreshTokenByHash(tokenHash: string, client?: PoolClient): Promise<void> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );
  },

  async revokeAllUserRefreshTokens(userId: string, client?: PoolClient): Promise<number> {
    const executor = getExecutor(client);
    const result = await executor.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
    return result.rowCount ?? 0;
  },

  async recordAuditLog(
    params: {
      actorUserId?: string | null;
      actorNameSnapshot?: string | null;
      action: string;
      entityType?: string;
      entityId?: string;
      details?: string;
      ipAddress?: string | null;
    },
    client?: PoolClient
  ): Promise<void> {
    const executor = getExecutor(client);
    await executor.query(
      `INSERT INTO audit_logs (actor_user_id, actor_name_snapshot, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.actorUserId || null,
        params.actorNameSnapshot || null,
        params.action,
        params.entityType || null,
        params.entityId || null,
        params.details || null,
        params.ipAddress || null
      ]
    );
  },

  // Future-ready hooks for email-link password reset
  async createPasswordResetToken(
    params: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
    client?: PoolClient
  ): Promise<PasswordResetTokenRecord> {
    const executor = getExecutor(client);
    const result = await executor.query<PasswordResetTokenRecord>(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, token_hash, expires_at, consumed_at, created_at`,
      [params.userId, params.tokenHash, params.expiresAt]
    );
    return result.rows[0];
  },

  async findPasswordResetTokenByHash(tokenHash: string, client?: PoolClient): Promise<PasswordResetTokenRecord | null> {
    const executor = getExecutor(client);
    const result = await executor.query<PasswordResetTokenRecord>(
      `SELECT id, user_id, token_hash, expires_at, consumed_at, created_at
       FROM password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );
    return result.rows[0] || null;
  },

  async markPasswordResetTokenConsumed(id: string, client?: PoolClient): Promise<void> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE password_reset_tokens
       SET consumed_at = NOW()
       WHERE id = $1`,
      [id]
    );
  },

  async invalidatePendingPasswordResetTokens(userId: string, client?: PoolClient): Promise<void> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE password_reset_tokens
       SET consumed_at = NOW()
       WHERE user_id = $1 AND consumed_at IS NULL`,
      [userId]
    );
  },

  async updateUserPassword(userId: string, passwordHash: string, client?: PoolClient): Promise<void> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = false, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );
  },

  // Future-ready hooks for Google OAuth and other identity providers
  async findIdentityByProvider(
    provider: string,
    providerSubject: string,
    client?: PoolClient
  ): Promise<UserAuthIdentityRecord | null> {
    const executor = getExecutor(client);
    const result = await executor.query<UserAuthIdentityRecord>(
      `SELECT id, user_id, provider, provider_subject, provider_email, created_at, updated_at
       FROM user_auth_identities
       WHERE provider = $1 AND provider_subject = $2`,
      [provider, providerSubject]
    );
    return result.rows[0] || null;
  },

  async createIdentity(
    params: {
      userId: string;
      provider: "password" | "phone_otp" | "google";
      providerSubject?: string | null;
      providerEmail?: string | null;
    },
    client?: PoolClient
  ): Promise<UserAuthIdentityRecord> {
    const executor = getExecutor(client);
    const result = await executor.query<UserAuthIdentityRecord>(
      `INSERT INTO user_auth_identities (user_id, provider, provider_subject, provider_email)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, provider, provider_subject, provider_email, created_at, updated_at`,
      [params.userId, params.provider, params.providerSubject || null, params.providerEmail || null]
    );
    return result.rows[0];
  }
};
