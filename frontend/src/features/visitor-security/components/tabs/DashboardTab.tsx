/**
 * Dashboard Tab
 * Main dashboard view with metrics and recent visitors
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { VisitorListItem, StatusBadge } from '../shared';
import { Avatar } from '../../../../components/UI/Avatar';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const DashboardTab: React.FC = React.memo(() => {
  const {
    metrics,
    filteredVisitors,
    loading,
    setSelectedVisitor,
    setShowQRModal,
    setShowRegisterModal
  } = useVisitorContext();

  if (loading.visitors && filteredVisitors.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
        <p className="text-[color:var(--text-sub)]">Synchronizing dashboard signals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-xl hover:border-blue-500/30 transition-all duration-300 group">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i className="fas fa-users text-white text-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-[color:var(--text-main)]">{metrics?.total || 0}</h3>
              <p className="text-[color:var(--text-sub)] text-xs font-bold uppercase tracking-widest">Registered Visitors</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-xl hover:border-green-500/30 transition-all duration-300 group">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i className="fas fa-check-circle text-white text-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-[color:var(--text-main)]">{metrics?.checked_in || 0}</h3>
              <p className="text-[color:var(--text-sub)] text-xs font-bold uppercase tracking-widest">Active Check-ins</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-xl hover:border-orange-500/30 transition-all duration-300 group">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i className="fas fa-exclamation-triangle text-white text-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-[color:var(--text-main)]">{metrics?.security_requests || 0}</h3>
              <p className="text-[color:var(--text-sub)] text-xs font-bold uppercase tracking-widest">Active Clearances</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-xl hover:border-purple-500/30 transition-all duration-300 group">
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <i className="fas fa-calendar-alt text-white text-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-[color:var(--text-main)]">{metrics?.active_events || 0}</h3>
              <p className="text-[color:var(--text-sub)] text-xs font-bold uppercase tracking-widest">Monitored Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visitors */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-shield-alt text-white text-sm" />
              </div>
              Site Access Log
            </CardTitle>
            <Button
              onClick={() => setShowRegisterModal(true)}
              variant="primary"
              className="text-xs font-black uppercase tracking-widest px-6"
            >
              <i className="fas fa-user-plus mr-2" />
              Register Visitor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {filteredVisitors.length === 0 ? (
            <EmptyState
              icon="fas fa-users-slash"
              title="No Active Visitor Records"
              description="Initialize a new registration to begin security monitoring of on-site personnel."
              className="bg-black/20 border-dashed border-2 border-white/10"
              action={{
                label: "REGISTER VISITOR",
                onClick: () => setShowRegisterModal(true),
                variant: 'outline'
              }}
            />
          ) : (
            <div className="space-y-3 mt-4">
              {filteredVisitors.slice(0, 5).map(visitor => (
                <div
                  key={visitor.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border-subtle)]/10 bg-[color:var(--console-dark)]/20 hover:bg-[color:var(--border-subtle)]/10 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="bg-gradient-to-br from-blue-700 to-indigo-900 border border-white/10">
                      {visitor.first_name[0]}{visitor.last_name[0]}
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-[color:var(--text-main)] group-hover:text-blue-400 transition-colors">
                        {visitor.first_name} {visitor.last_name}
                      </h4>
                      <p className="text-sm text-[color:var(--text-sub)]/70 italic">
                        {visitor.purpose} <span className="mx-1 opacity-30">•</span> {visitor.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={visitor.status} />
                    {visitor.qr_code && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVisitor(visitor);
                          setShowQRModal(true);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-main)]"
                      >
                        <i className="fas fa-qrcode" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

DashboardTab.displayName = 'DashboardTab';
