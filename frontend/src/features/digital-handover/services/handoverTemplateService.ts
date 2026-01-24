/**
 * Digital Handover Template Service
 * 
 * Service layer for checklist template management.
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import { logger } from '../../../services/logger';
import type { ChecklistTemplate, ChecklistTemplateItem } from '../types';

export interface CreateTemplateRequest {
  name: string;
  category: string;
  operationalPost?: string;
  items: ChecklistTemplateItem[];
  isDefault?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  category?: string;
  operationalPost?: string;
  items?: ChecklistTemplateItem[];
  isDefault?: boolean;
}

/**
 * Handover Template Service
 */
export const handoverTemplateService = {
  /**
   * Get all checklist templates
   */
  async getTemplates(propertyId: string, operationalPost?: string): Promise<ChecklistTemplate[]> {
    try {
      const params: Record<string, string> = { property_id: propertyId };
      if (operationalPost) params.operational_post = operationalPost;

      const response = await apiService.get<ChecklistTemplate[]>('/handovers/templates', { params });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch templates');
      }
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to fetch templates',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverTemplateService', action: 'getTemplates', operationalPost }
      );
      throw error;
    }
  },

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<ChecklistTemplate> {
    try {
      const response = await apiService.get<ChecklistTemplate>(`/handovers/templates/${id}`);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to fetch template ${id}`);
      }
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to fetch template ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverTemplateService', action: 'getTemplate', templateId: id }
      );
      throw error;
    }
  },

  /**
   * Create a new template
   */
  async createTemplate(propertyId: string, data: CreateTemplateRequest): Promise<ChecklistTemplate> {
    try {
      const response = await apiService.post<ChecklistTemplate>('/handovers/templates', { ...data, property_id: propertyId });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create template');
      }
      logger.info('Template created successfully', { module: 'handoverTemplateService', action: 'createTemplate', templateId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to create template',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverTemplateService', action: 'createTemplate', data }
      );
      throw error;
    }
  },

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<ChecklistTemplate> {
    try {
      const response = await apiService.put<ChecklistTemplate>(`/handovers/templates/${id}`, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to update template ${id}`);
      }
      logger.info('Template updated successfully', { module: 'handoverTemplateService', action: 'updateTemplate', templateId: id });
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to update template ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverTemplateService', action: 'updateTemplate', templateId: id, data }
      );
      throw error;
    }
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const response = await apiService.delete<void>(`/handovers/templates/${id}`);
      if (!response.success) {
        throw new Error(response.error || `Failed to delete template ${id}`);
      }
      logger.info('Template deleted successfully', { module: 'handoverTemplateService', action: 'deleteTemplate', templateId: id });
    } catch (error) {
      logger.error(
        `Failed to delete template ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverTemplateService', action: 'deleteTemplate', templateId: id }
      );
      throw error;
    }
  },
};
