/**
 * Property Items WebSocket Hook
 * Handles real-time updates for Lost & Found items and Packages
 */

import { useEffect } from 'react';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { logger } from '../../../services/logger';
import type { LostFoundItem } from '../../lost-and-found/types/lost-and-found.types';
import type { Package } from '../../packages/types/package.types';

export interface UsePropertyItemsWebSocketOptions {
  onLostFoundItemCreated?: (item: LostFoundItem) => void;
  onLostFoundItemUpdated?: (item: LostFoundItem) => void;
  onLostFoundItemDeleted?: (itemId: string) => void;
  onPackageCreated?: (pkg: Package) => void;
  onPackageUpdated?: (pkg: Package) => void;
  onPackageDeleted?: (packageId: string) => void;
}

export function usePropertyItemsWebSocket(options: UsePropertyItemsWebSocketOptions = {}) {
  const { isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to Lost & Found events
    const unsubscribeLostFoundCreated = subscribe('lost_found_item_created', (data: any) => {
      if (data?.item && options.onLostFoundItemCreated) {
        logger.info('Lost & Found item created via WebSocket', {
          module: 'PropertyItemsWebSocket',
          itemId: data.item.id
        });
        options.onLostFoundItemCreated(data.item);
      }
    });

    const unsubscribeLostFoundUpdated = subscribe('lost_found_item_updated', (data: any) => {
      if (data?.item && options.onLostFoundItemUpdated) {
        logger.info('Lost & Found item updated via WebSocket', {
          module: 'PropertyItemsWebSocket',
          itemId: data.item.id
        });
        options.onLostFoundItemUpdated(data.item);
      }
    });

    const unsubscribeLostFoundDeleted = subscribe('lost_found_item_deleted', (data: any) => {
      if (data?.item_id && options.onLostFoundItemDeleted) {
        logger.info('Lost & Found item deleted via WebSocket', {
          module: 'PropertyItemsWebSocket',
          itemId: data.item_id
        });
        options.onLostFoundItemDeleted(data.item_id);
      }
    });

    // Subscribe to Package events
    const unsubscribePackageCreated = subscribe('package_created', (data: any) => {
      if (data?.package && options.onPackageCreated) {
        logger.info('Package created via WebSocket', {
          module: 'PropertyItemsWebSocket',
          packageId: data.package.id
        });
        options.onPackageCreated(data.package);
      }
    });

    const unsubscribePackageUpdated = subscribe('package_updated', (data: any) => {
      if (data?.package && options.onPackageUpdated) {
        logger.info('Package updated via WebSocket', {
          module: 'PropertyItemsWebSocket',
          packageId: data.package.id
        });
        options.onPackageUpdated(data.package);
      }
    });

    const unsubscribePackageDeleted = subscribe('package_deleted', (data: any) => {
      if (data?.package_id && options.onPackageDeleted) {
        logger.info('Package deleted via WebSocket', {
          module: 'PropertyItemsWebSocket',
          packageId: data.package_id
        });
        options.onPackageDeleted(data.package_id);
      }
    });

    return () => {
      unsubscribeLostFoundCreated();
      unsubscribeLostFoundUpdated();
      unsubscribeLostFoundDeleted();
      unsubscribePackageCreated();
      unsubscribePackageUpdated();
      unsubscribePackageDeleted();
    };
  }, [isConnected, subscribe, options]);
}
