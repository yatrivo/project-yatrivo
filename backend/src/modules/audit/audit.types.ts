export interface AuditLogRecord {
  id: string;
  actor_user_id: string | null;
  actor_name_snapshot: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  before_data: any | null;
  after_data: any | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface FormattedAuditLog {
  id: string;
  userId: string | null;
  user: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string;
  beforeData: any | null;
  afterData: any | null;
  ip: string;
  userAgent: string | null;
  date: string;
  createdAt: string;
}

export interface CreateAuditLogParams {
  actorUserId?: string | null;
  actorNameSnapshot?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: string | null;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  req?: any; // Express Request for automatic context extraction
}

export interface AuditLogQuery {
  search?: string;
  action?: string;
  entityType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogListResult {
  logs: FormattedAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
