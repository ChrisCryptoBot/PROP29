/**
 * useHandoverTemplates Hook
 * 
 * Custom hook for checklist template management.
 */

import { useState, useEffect, useCallback } from 'react';
import { handoverTemplateService, type CreateTemplateRequest, type UpdateTemplateRequest } from '../services/handoverTemplateService';
import { logger } from '../../../services/logger';
import type { ChecklistTemplate } from '../types';

export interface UseHandoverTemplatesReturn {
  // Data
  templates: ChecklistTemplate[];

  // Loading states
  loading: boolean;
  error: Error | null;

  // Operations
  loadTemplates: (propertyId?: string, operationalPost?: string) => Promise<void>;
  getTemplate: (id: string) => Promise<ChecklistTemplate>;
  createTemplate: (propertyId: string | CreateTemplateRequest, data?: CreateTemplateRequest) => Promise<ChecklistTemplate>;
  updateTemplate: (id: string, data: UpdateTemplateRequest) => Promise<ChecklistTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: (propertyId?: string) => Promise<void>;

  // Filter
  operationalPost: string | undefined;
  setOperationalPost: (post: string | undefined) => void;
}

/**
 * Hook for managing handover templates
 */
export function useHandoverTemplates(initialPost?: string): UseHandoverTemplatesReturn {
  // State
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [operationalPost, setOperationalPost] = useState<string | undefined>(initialPost);

  /**
   * Load templates
   */
  const loadTemplates = useCallback(async (propertyId?: string, operationalPostFilter?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activePropertyId = propertyId || localStorage.getItem('propertyId') || '';
      const data = await handoverTemplateService.getTemplates(activePropertyId, operationalPostFilter || operationalPost);
      setTemplates(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load templates', error, { module: 'useHandoverTemplates', action: 'loadTemplates' });
    } finally {
      setLoading(false);
    }
  }, [operationalPost]);

  /**
   * Load templates on mount and when operational post changes
   */
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /**
   * Get a single template
   */
  const getTemplate = useCallback(async (id: string): Promise<ChecklistTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const template = await handoverTemplateService.getTemplate(id);
      return template;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to get template', error, { module: 'useHandoverTemplates', action: 'getTemplate', templateId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a template
   */
  const createTemplate = useCallback(async (propertyId: string | CreateTemplateRequest, data?: CreateTemplateRequest): Promise<ChecklistTemplate> => {
    try {
      setLoading(true);
      setError(null);

      let activePropertyId: string;
      let templateData: CreateTemplateRequest;

      if (typeof propertyId === 'string') {
        activePropertyId = propertyId;
        templateData = data!;
      } else {
        activePropertyId = localStorage.getItem('propertyId') || '';
        templateData = propertyId;
      }

      const newTemplate = await handoverTemplateService.createTemplate(activePropertyId, templateData);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to create template', error, { module: 'useHandoverTemplates', action: 'createTemplate' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a template
   */
  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateRequest): Promise<ChecklistTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await handoverTemplateService.updateTemplate(id, data);
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to update template', error, { module: 'useHandoverTemplates', action: 'updateTemplate', templateId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await handoverTemplateService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to delete template', error, { module: 'useHandoverTemplates', action: 'deleteTemplate', templateId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh templates
   */
  const refreshTemplates = useCallback(async (propertyId?: string): Promise<void> => {
    await loadTemplates(propertyId);
  }, [loadTemplates]);

  return {
    // Data
    templates,

    // Loading states
    loading,
    error,

    // Operations
    loadTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates,

    // Filter
    operationalPost,
    setOperationalPost,
  };
}
