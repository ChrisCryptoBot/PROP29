/**
 * AI Analytics Tab Component
 * Extracted from monolithic AccessControlModule.tsx (lines 2976-2992)
 * 
 * Gold Standard Checklist:
 * ✅ Uses useAccessControlContext() hook - consumes data from context
 * ✅ Wrapped in ErrorBoundary - error isolation
 * ✅ React.memo applied - prevents unnecessary re-renders
 * ✅ Accessibility (a11y) - ARIA labels, keyboard navigation, semantic HTML
 */

import React from 'react';
import { ErrorBoundary } from '../../../../components/UI/ErrorBoundary';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { BehaviorAnalysisPanel } from '../../../../components/AccessControlModule/BehaviorAnalysisPanel';

/**
 * AI Analytics Tab Component
 * Displays AI-powered behavior analysis and anomaly detection
 */
const AIAnalyticsTabComponent: React.FC = () => {
  const {
    accessEvents,
    users,
  } = useAccessControlContext();

  // Map AccessControlUser to User type expected by BehaviorAnalysisPanel
  // The User type has a more restrictive role type, so we map compatible roles
  const mappedUsers = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: (user.role === 'admin' || user.role === 'manager' || user.role === 'employee' || user.role === 'guest'
      ? user.role
      : 'employee') as 'admin' | 'manager' | 'employee' | 'guest',
    department: user.department,
    status: user.status,
    accessLevel: user.accessLevel,
    lastAccess: user.lastAccess,
    accessCount: user.accessCount
  }));

  const hasData = accessEvents.length > 0 && users.length > 0;

  return (
    <div className="space-y-6" role="main" aria-label="AI Analytics">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">AI Analytics</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            System insights and anomaly detection
          </p>
        </div>
      </div>

      {hasData ? (
        <ErrorBoundary moduleName="AI Behavior Analysis Panel">
          <BehaviorAnalysisPanel events={accessEvents} users={mappedUsers} />
        </ErrorBoundary>
      ) : (
        <EmptyState
          icon="fas fa-brain"
          title="No analysis data yet"
          description="Add access events and users to run AI analysis."
          className="bg-black/20 border-dashed border-2 border-white/5 rounded-3xl p-12"
        />
      )}
    </div>
  );
};

/**
 * AIAnalyticsTab with ErrorBoundary
 * Wrapped in ErrorBoundary for error isolation per Gold Standard checklist
 */
export const AIAnalyticsTab: React.FC = React.memo(() => {
  return (
    <ErrorBoundary moduleName="AI Analytics Tab">
      <AIAnalyticsTabComponent />
    </ErrorBoundary>
  );
});

AIAnalyticsTab.displayName = 'AIAnalyticsTab';
export default AIAnalyticsTab;

