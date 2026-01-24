/**
 * Badges & Access Tab
 * Tab for managing visitor badges and access points
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const BadgesAccessTab: React.FC = React.memo(() => {
  const {
    filteredVisitors,
    loading,
    setSelectedVisitor,
    setShowQRModal,
    setShowBadgeModal
  } = useVisitorContext();

  // Filter to only checked-in visitors
  const checkedInVisitors = React.useMemo(() => {
    return filteredVisitors.filter(v => v.status === 'checked_in');
  }, [filteredVisitors]);

  if (loading.visitors && checkedInVisitors.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
        <p className="text-[color:var(--text-sub)]">Synchronizing credential data...</p>
      </div>
    );
  }

  return (
    <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
        <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
          <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-emerald-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <i className="fas fa-id-badge text-white text-sm" />
          </div>
          Active Credentials & Sector Access
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {checkedInVisitors.length === 0 ? (
          <EmptyState
            icon="fas fa-id-badge"
            title="No Active Credentials in Registry"
            description="Security credentials are only generated for personnel with an active check-in status."
            className="bg-black/20 border-dashed border-2 border-white/10"
          />
        ) : (
          <div className="space-y-4 mt-4">
            {checkedInVisitors.map(visitor => (
              <div
                key={visitor.id}
                className="p-5 rounded-xl border border-[color:var(--border-subtle)]/20 bg-[color:var(--console-dark)]/20 group hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-[color:var(--text-main)] group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                      {visitor.first_name} {visitor.last_name}
                    </h4>
                    <p className="text-[10px] font-mono text-[color:var(--text-sub)]/60 mt-1 uppercase tracking-widest">CREDENTIAL ID: {visitor.badge_id}</p>
                    {visitor.event_name && (
                      <p className="text-[10px] font-black text-indigo-400 mt-2 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 w-fit">
                        {visitor.event_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVisitor(visitor);
                        setShowQRModal(true);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-main)]"
                    >
                      <i className="fas fa-qrcode mr-2" />
                      View QR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVisitor(visitor);
                        setShowBadgeModal(true);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-main)]"
                    >
                      <i className="fas fa-id-card mr-2" />
                      Print Credential
                    </Button>
                  </div>
                </div>
                {visitor.access_points && visitor.access_points.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[color:var(--border-subtle)]/10">
                    <p className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-3">Authorized Security Sectors</p>
                    <div className="flex flex-wrap gap-2">
                      {visitor.access_points.map(apId => (
                        <span key={apId} className="px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20">
                          SECTOR {apId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

BadgesAccessTab.displayName = 'BadgesAccessTab';
