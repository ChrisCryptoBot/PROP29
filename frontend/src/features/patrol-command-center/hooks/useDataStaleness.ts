/**
 * Data Staleness Detection Hook
 * Monitors data freshness and warns when data is stale
 * Critical for hardware integration where stale data can cause safety issues
 */

import { useMemo } from 'react';
import type { PatrolSettings } from '../types';

export interface DataStalenessInfo {
    isStale: boolean;
    stalenessMinutes: number;
    stalenessMessage: string;
    shouldWarn: boolean;
}

const STALE_THRESHOLD_MINUTES = 5; // Warn if data is older than 5 minutes
const CRITICAL_STALE_THRESHOLD_MINUTES = 15; // Critical warning if older than 15 minutes

export function useDataStaleness(
    lastSyncTimestamp: Date | null,
    settings: PatrolSettings
): DataStalenessInfo {
    const stalenessInfo = useMemo(() => {
        if (!lastSyncTimestamp) {
            return {
                isStale: true,
                stalenessMinutes: Infinity,
                stalenessMessage: 'No data sync timestamp available',
                shouldWarn: true
            };
        }

        const now = Date.now();
        const lastSync = lastSyncTimestamp.getTime();
        const elapsed = now - lastSync;
        const stalenessMinutes = Math.floor(elapsed / 60000);

        const isStale = stalenessMinutes > STALE_THRESHOLD_MINUTES;
        const isCritical = stalenessMinutes > CRITICAL_STALE_THRESHOLD_MINUTES;

        let stalenessMessage = '';
        if (stalenessMinutes < 1) {
            stalenessMessage = 'Just now';
        } else if (stalenessMinutes < 60) {
            stalenessMessage = `${stalenessMinutes} minute${stalenessMinutes !== 1 ? 's' : ''} ago`;
        } else {
            const hours = Math.floor(stalenessMinutes / 60);
            stalenessMessage = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }

        return {
            isStale,
            stalenessMinutes,
            stalenessMessage,
            shouldWarn: isStale && (isCritical || !settings.offlineMode)
        };
    }, [lastSyncTimestamp, settings.offlineMode]);

    return stalenessInfo;
}
