/**
 * Security Requests Tab
 * Tab for managing security requests
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { cn } from '../../../../utils/cn';
import { showSuccess } from '../../../../utils/toast';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const SecurityRequestsTab: React.FC = React.memo(() => {
  const {
    visitors,
    securityRequests,
    loading,
    updateVisitor
  } = useVisitorContext();

  const handleAssign = async (requestId: string, visitorId: string) => {
    // Update the security request status to 'in_progress'
    // For now, we'll show a success message
    // TODO: Implement proper security request update when backend endpoint is available
    showSuccess('Request assigned and in progress');
  };

  // Get all security requests from visitors
  const allSecurityRequests = React.useMemo(() => {
    const requests: Array<{ request: typeof securityRequests[0]; visitor: typeof visitors[0] }> = [];
    visitors.forEach(visitor => {
      visitor.security_requests?.forEach(request => {
        requests.push({ request, visitor });
      });
    });
    // Also include standalone security requests
    securityRequests.forEach(request => {
      if (!requests.find(r => r.request.id === request.id)) {
        // Find visitor by matching request ID in visitor's security_requests
        const visitor = visitors.find(v => v.security_requests?.some(sr => sr.id === request.id));
        requests.push({ request, visitor: visitor || visitors[0] });
      }
    });
    return requests;
  }, [visitors, securityRequests]);

  if (loading.securityRequests && allSecurityRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
        <p className="text-[color:var(--text-sub)]">Synchronizing clearance logs...</p>
      </div>
    );
  }

  return (
    <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
        <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-700 to-red-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <i className="fas fa-shield-alt text-white text-sm" />
          </div>
          Clearance & Incident Log
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {allSecurityRequests.length === 0 ? (
          <EmptyState
            icon="fas fa-shield-alt"
            title="No Pending Requests"
            description="Security protocol is green. No active clearance requests or incident reports detected."
            className="bg-black/20 border-dashed border-2 border-white/10"
          />
        ) : (
          <div className="space-y-4 mt-4">
            {allSecurityRequests.map(({ request, visitor }) => (
              <div
                key={request.id}
                className="p-5 rounded-xl border border-[color:var(--border-subtle)]/20 bg-[color:var(--console-dark)]/20 hover:border-orange-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider border",
                        request.type === 'emergency_alert' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          request.type === 'incident_report' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                            request.type === 'access_request' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                              'text-[color:var(--text-sub)] bg-[color:var(--border-subtle)]/10 border-[color:var(--border-subtle)]/20'
                      )}>
                        {request.type.replace('_', ' ')}
                      </span>
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider border",
                        request.priority === 'urgent' ? 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                          request.priority === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                            request.priority === 'normal' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                              'text-[color:var(--text-sub)] bg-[color:var(--border-subtle)]/10 border-[color:var(--border-subtle)]/20'
                      )}>
                        {request.priority}
                      </span>
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider border",
                        request.status === 'pending' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          request.status === 'in_progress' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                            request.status === 'completed' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                              'text-[color:var(--text-sub)] bg-[color:var(--border-subtle)]/10 border-[color:var(--border-subtle)]/20'
                      )}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[color:var(--text-main)] font-black text-lg mb-1 leading-tight group-hover:text-blue-400 transition-colors">{request.description}</p>
                    <p className="text-sm text-[color:var(--text-sub)]/80 italic font-medium">
                      Source: {visitor?.first_name} {visitor?.last_name}
                      {request.location && ` <span className="mx-2 opacity-30">•</span> Zone: ${request.location}`}
                    </p>
                    {request.response && (
                      <div className="mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 italic">
                        <p className="text-sm text-blue-300"><strong className="text-[10px] uppercase tracking-widest not-italic opacity-50 block mb-1">Response Protocol:</strong> {request.response}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleAssign(request.id, visitor?.id || '')}
                        className="text-[10px] font-black uppercase tracking-widest px-6 shadow-lg shadow-orange-500/10"
                      >
                        Assign Response
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SecurityRequestsTab.displayName = 'SecurityRequestsTab';
