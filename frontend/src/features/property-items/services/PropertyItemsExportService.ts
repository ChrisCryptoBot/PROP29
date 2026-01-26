/**
 * Property Items Export Service
 * Unified export functionality for both Lost & Found items and Packages
 */

import { env } from '../../../config/env';
import { logger } from '../../../services/logger';

export type ExportFormat = 'pdf' | 'csv';
export type ExportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ExportOptions {
  format: ExportFormat;
  period: ExportPeriod;
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  includeLostFound?: boolean;
  includePackages?: boolean;
  filters?: {
    lostFoundStatus?: string;
    packageStatus?: string;
  };
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
}

class PropertyItemsExportService {
  /**
   * Export unified report (Lost & Found + Packages)
   */
  async exportUnifiedReport(options: ExportOptions): Promise<ExportResult> {
    try {
      const { format, period, startDate, endDate, propertyId, includeLostFound = true, includePackages = true } = options;

      // Calculate date range if not provided
      const dateRange = this.calculateDateRange(period, startDate, endDate);

      // Build query parameters
      const params: Record<string, string> = {
        format,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      };

      if (propertyId) params.property_id = propertyId;
      if (includeLostFound) params.include_lost_found = 'true';
      if (includePackages) params.include_packages = 'true';
      if (options.filters?.lostFoundStatus) params.lost_found_status = options.filters.lostFoundStatus;
      if (options.filters?.packageStatus) params.package_status = options.filters.packageStatus;

      const token = localStorage.getItem('access_token');
      const baseUrl = env.API_BASE_URL || 'http://localhost:8000/api';

      const queryString = new URLSearchParams(params).toString();
      const url = `${baseUrl}/property-items/export?${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: format === 'pdf' ? 'application/pdf' : 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const filename = this.generateFilename(format, period, dateRange.startDate, dateRange.endDate);

      // Trigger download
      this.downloadBlob(blob, filename);

      logger.info('Property items export successful', {
        module: 'PropertyItemsExport',
        format,
        period,
        filename
      });

      return {
        success: true,
        blob,
        filename
      };
    } catch (error) {
      logger.error('Property items export failed', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsExport',
        options
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  /**
   * Export Lost & Found items only
   */
  async exportLostFoundItems(
    format: ExportFormat,
    period: ExportPeriod,
    startDate?: string,
    endDate?: string,
    propertyId?: string
  ): Promise<ExportResult> {
    return this.exportUnifiedReport({
      format,
      period,
      startDate,
      endDate,
      propertyId,
      includeLostFound: true,
      includePackages: false
    });
  }

  /**
   * Export Packages only
   */
  async exportPackages(
    format: ExportFormat,
    period: ExportPeriod,
    startDate?: string,
    endDate?: string,
    propertyId?: string
  ): Promise<ExportResult> {
    return this.exportUnifiedReport({
      format,
      period,
      startDate,
      endDate,
      propertyId,
      includeLostFound: false,
      includePackages: true
    });
  }

  /**
   * Calculate date range based on period
   */
  private calculateDateRange(period: ExportPeriod, startDate?: string, endDate?: string): { startDate: string; endDate: string } {
    if (startDate && endDate) {
      return { startDate, endDate };
    }

    const now = new Date();
    let start: Date;

    switch (period) {
      case 'daily':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case 'custom':
      default:
        start = new Date(now);
        start.setDate(start.getDate() - 30); // Default to last 30 days
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: now.toISOString()
    };
  }

  /**
   * Generate filename for export
   */
  private generateFilename(format: ExportFormat, period: ExportPeriod, startDate: string, endDate: string): string {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const periodStr = period === 'custom' ? 'custom' : period;
    return `property-items-${periodStr}-${dateStr}.${format}`;
  }

  /**
   * Trigger browser download of blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const propertyItemsExportService = new PropertyItemsExportService();
export default propertyItemsExportService;
