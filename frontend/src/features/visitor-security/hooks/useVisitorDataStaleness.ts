/**
 * Data staleness for Visitor Security module.
 * Warns when visitor/event data has not been synced recently.
 */

import { useMemo } from 'react';

const STALE_THRESHOLD_MINUTES = 5;
const CRITICAL_STALE_THRESHOLD_MINUTES = 15;

export interface VisitorDataStalenessInfo {
  isStale: boolean;
  stalenessMinutes: number;
  stalenessMessage: string;
  shouldWarn: boolean;
}

export function useVisitorDataStaleness(lastSynced: string | null): VisitorDataStalenessInfo {
  return useMemo(() => {
    if (!lastSynced) {
      return {
        isStale: true,
        stalenessMinutes: Infinity,
        stalenessMessage: 'No data sync timestamp',
        shouldWarn: true
      };
    }
    const now = Date.now();
    const last = new Date(lastSynced).getTime();
    const elapsed = now - last;
    const stalenessMinutes = Math.floor(elapsed / 60000);
    const isStale = stalenessMinutes > STALE_THRESHOLD_MINUTES;
    const isCritical = stalenessMinutes > CRITICAL_STALE_THRESHOLD_MINUTES;
    let stalenessMessage = '';
    if (stalenessMinutes < 1) stalenessMessage = 'Just now';
    else if (stalenessMinutes < 60) stalenessMessage = `${stalenessMinutes} min ago`;
    else stalenessMessage = `${Math.floor(stalenessMinutes / 60)} h ago`;
    return {
      isStale,
      stalenessMinutes,
      stalenessMessage,
      shouldWarn: isStale && isCritical
    };
  }, [lastSynced]);
}
