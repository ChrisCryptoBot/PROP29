/**
 * Digital Handover Attachment Service
 * 
 * Service layer for media/attachment management (photos, audio, documents).
 */

import axios from 'axios';
import { logger } from '../../../services/logger';
import { env } from '../../../config/env';
import type { Attachment, AttachmentType } from '../types';

export interface UploadAttachmentRequest {
  handoverId: string;
  file: File;
  description?: string;
  attachmentType: AttachmentType;
}

/**
 * Handover Attachment Service
 */
export const handoverAttachmentService = {
  /**
   * Get all attachments for a handover
   */
  async getAttachments(handoverId: string): Promise<Attachment[]> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get<Attachment[]>(
        `${env.API_BASE_URL}/api/handovers/${handoverId}/attachments`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );
      return response.data || [];
    } catch (error) {
      logger.error(
        `Failed to fetch attachments for handover ${handoverId}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverAttachmentService', action: 'getAttachments', handoverId }
      );
      throw error;
    }
  },

  /**
   * Upload an attachment (photo, audio, document)
   */
  async uploadAttachment(data: UploadAttachmentRequest): Promise<Attachment> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('handover_id', data.handoverId);
      formData.append('attachment_type', data.attachmentType);
      if (data.description) {
        formData.append('description', data.description);
      }

      const token = localStorage.getItem('access_token');
      const response = await axios.post<Attachment>(
        `${env.API_BASE_URL}/api/handovers/${data.handoverId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      logger.info('Attachment uploaded successfully', {
        module: 'handoverAttachmentService',
        action: 'uploadAttachment',
        attachmentId: response.data.id,
        handoverId: data.handoverId,
      });

      return response.data;
    } catch (error) {
      logger.error(
        `Failed to upload attachment for handover ${data.handoverId}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverAttachmentService', action: 'uploadAttachment', handoverId: data.handoverId }
      );
      throw error;
    }
  },

  /**
   * Delete an attachment
   */
  async deleteAttachment(handoverId: string, attachmentId: string): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(
        `${env.API_BASE_URL}/api/handovers/${handoverId}/attachments/${attachmentId}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      logger.info('Attachment deleted successfully', {
        module: 'handoverAttachmentService',
        action: 'deleteAttachment',
        attachmentId,
        handoverId,
      });
    } catch (error) {
      logger.error(
        `Failed to delete attachment ${attachmentId} for handover ${handoverId}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverAttachmentService', action: 'deleteAttachment', attachmentId, handoverId }
      );
      throw error;
    }
  },

  /**
   * Get attachment download URL
   */
  getAttachmentUrl(handoverId: string, attachmentId: string): string {
    // Construct URL for attachment download
    // Backend should provide this endpoint
    return `/api/handovers/${handoverId}/attachments/${attachmentId}/download`;
  },
};
