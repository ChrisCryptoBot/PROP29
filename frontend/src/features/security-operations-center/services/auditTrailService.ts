/**
 * Audit Trail Service
 * Logs all changes for security and compliance
 */

import { logger } from '../../../services/logger';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  entity: 'camera' | 'recording' | 'evidence' | 'settings';
  entityId: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
}

const AUDIT_LOG_KEY = 'security-operations.audit-log';
const MAX_LOG_ENTRIES = 1000;

class AuditTrailService {
  private async logEntry(action: string, entity: AuditLogEntry['entity'], entityId: string, changes?: Record<string, { from: unknown; to: unknown }>, metadata?: Record<string, unknown>): Promise<void> {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: (window as any).__USER_ID__ || undefined,
      action,
      entity,
      entityId,
      changes,
      metadata
    };

    // Send to backend (authoritative, tamper-evident)
    try {
      const apiService = (await import('../../../services/ApiService')).default;
      await apiService.post('/security-operations/audit-trail', {
        action,
        entity,
        entity_id: entityId,
        changes,
        metadata,
      });
    } catch (error) {
      logger.error('Failed to send audit log to backend', error instanceof Error ? error : new Error(String(error)), {
        module: 'AuditTrailService'
      });
      // Fallback to localStorage if backend unavailable
      try {
        const logs = this.getLogs();
        logs.unshift(entry);
        if (logs.length > MAX_LOG_ENTRIES) {
          logs.splice(MAX_LOG_ENTRIES);
        }
        localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
      } catch (e) {
        logger.error('Failed to save audit log to localStorage', e instanceof Error ? e : new Error(String(e)));
      }
    }

    logger.info('Audit log entry', {
      module: 'AuditTrailService',
      ...entry
    });
  }

  async logCameraChange(action: string, cameraId: string, changes?: Record<string, { from: unknown; to: unknown }>, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEntry(action, 'camera', cameraId, changes, metadata);
  }

  async logEvidenceChange(action: string, evidenceId: string, changes?: Record<string, { from: unknown; to: unknown }>, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEntry(action, 'evidence', evidenceId, changes, metadata);
  }

  async logSettingsChange(action: string, changes?: Record<string, { from: unknown; to: unknown }>, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEntry(action, 'settings', 'global', changes, metadata);
  }

  async logRecordingChange(action: string, recordingId: string, changes?: Record<string, { from: unknown; to: unknown }>, metadata?: Record<string, unknown>): Promise<void> {
    await this.logEntry(action, 'recording', recordingId, changes, metadata);
  }

  getLogs(limit?: number): AuditLogEntry[] {
    try {
      const raw = localStorage.getItem(AUDIT_LOG_KEY);
      const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
      return limit ? logs.slice(0, limit) : logs;
    } catch {
      return [];
    }
  }

  getLogsByEntity(entity: AuditLogEntry['entity'], entityId?: string): AuditLogEntry[] {
    const logs = this.getLogs();
    return logs.filter(log => {
      if (log.entity !== entity) return false;
      if (entityId && log.entityId !== entityId) return false;
      return true;
    });
  }

  clearLogs(): void {
    localStorage.removeItem(AUDIT_LOG_KEY);
  }
}

export const auditTrailService = new AuditTrailService();
export default auditTrailService;
