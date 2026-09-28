import type { PoolClient } from "pg";
import { query } from "../../db/postgres";
import type { AdminUserSummary } from "./users.types";

export interface DbUserRow {
  id: string;
  full_name: string | null;
  email: string;
  role: "super_admin" | "admin" | "user";
  status: "invited" | "active" | "disabled" | "deleted";
  must_change_password: boolean;
  last_login_at: Date | string | null;
  created_at: Date | string;
}

function toAdminSummary(row: DbUserRow): AdminUserSummary {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role as "super_admin" | "admin",
    status: row.status as "active" | "disabled",
    mustChangePassword: Boolean(row.must_change_password),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString()
  };
}

export const usersRepository = {
  async listAdmins(client?: PoolClient): Promise<AdminUserSummary[]> {
    const q = client ? client.query.bind(client) : query;
    const result = await q<DbUserRow>(
      `SELECT id, full_name, email, role, status, must_change_password, last_login_at, created_at
       FROM users
       WHERE role IN ('admin', 'super_admin') AND status != 'deleted'
       ORDER BY created_at ASC`
    );
    return result.rows.map(toAdminSummary);
  },

  async findAdminById(id: string, client?: PoolClient): Promise<AdminUserSummary | null> {
    const q = client ? client.query.bind(client) : query;
    const result = await q<DbUserRow>(
      `SELECT id, full_name, email, role, status, must_change_password, last_login_at, created_at
       FROM users
       WHERE id = $1 AND role IN ('admin', 'super_admin')`,
      [id]
    );
    return result.rows[0] ? toAdminSummary(result.rows[0]) : null;
  },

  async findUserByEmail(email: string, client?: PoolClient): Promise<{ id: string; email: string; role: string; status: string } | null> {
    const q = client ? client.query.bind(client) : query;
    const result = await q<{ id: string; email: string; role: string; status: string }>(
      `SELECT id, email, role, status
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async createAdminUser(
    params: {
      fullName: string;
      email: string;
      role: "admin" | "super_admin";
      passwordHash: string;
      invitedByUserId: string;
    },
    client?: PoolClient
  ): Promise<AdminUserSummary> {
    const q = client ? client.query.bind(client) : query;
    const result = await q<DbUserRow>(
      `INSERT INTO users (full_name, email, role, status, password_hash, must_change_password, invited_by_user_id)
       VALUES ($1, $2, $3, 'active', $4, true, $5)
       RETURNING id, full_name, email, role, status, must_change_password, last_login_at, created_at`,
      [
        params.fullName,
        params.email.toLowerCase(),
        params.role,
        params.passwordHash,
        params.invitedByUserId
      ]
    );
    return toAdminSummary(result.rows[0]);
  },

  async updateAdminStatus(
    id: string,
    status: "active" | "disabled",
    client?: PoolClient
  ): Promise<AdminUserSummary | null> {
    const q = client ? client.query.bind(client) : query;
    const result = await q<DbUserRow>(
      `UPDATE users
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND role IN ('admin', 'super_admin')
       RETURNING id, full_name, email, role, status, must_change_password, last_login_at, created_at`,
      [status, id]
    );
    return result.rows[0] ? toAdminSummary(result.rows[0]) : null;
  }
};
