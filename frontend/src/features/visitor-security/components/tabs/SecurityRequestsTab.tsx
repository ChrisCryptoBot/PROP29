/**
 * Security Requests Tab
 * Tab for managing security requests
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Select } from '../../../../components/UI/Select';
import { useVisitorContext } from '../../context/VisitorContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../utils/formatLocation';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const SecurityRequestsTab: React.FC = React.memo(() => {
  const {
    visitors,
    securityRequests,
    loading,
    updateVisitor,
    assignSecurityRequest,
    // Mobile Agent & Hardware Integration
    mobileAgentSubmissions,
    hardwareDevices,
    processAgentSubmission,
    refreshAgentSubmissions
  } = useVisitorContext();
  const { user } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const handleAssign = async (requestId: string, _visitorId: string) => {
    const assigneeId = user?.user_id ?? '';
    if (!assigneeId) return;
    await assignSecurityRequest(requestId, assigneeId, 'in_progress');
  };

  const handleComplete = async (requestId: string) => {
    const assigneeId = user?.user_id ?? '';
    if (!assigneeId) return;
    await assignSecurityRequest(requestId, assigneeId, 'completed');
  };

  const handleCancelRequest = async (requestId: string) => {
    const assigneeId = user?.user_id ?? '';
    if (!assigneeId) return;
    await assignSecurityRequest(requestId, assigneeId, 'cancelled');
  };

  const handleRejectSubmission = async (submissionId: string) => {
    const reason = window.prompt('Rejection reason (optional):', 'Requires additional verification');
    await processAgentSubmission(submissionId, 'reject', reason ?? undefined);
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
    <div className="space-y-6">
      {/* Page Header - Gold Standard */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Security Requests & Agent Submissions</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Process mobile agent submissions, security clearances, and incident escalations.
          </p>
        </div>
        
        <Button
          onClick={() => refreshAgentSubmissions()}
          variant="outline"
          disabled={loading.agentSubmissions}
            className="text-[9px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:bg-white/5"
        >
          <i className={cn("fas fa-sync-alt mr-1", loading.agentSubmissions && "animate-spin")} />
          Refresh Submissions
        </Button>
      </div>

      {/* Mobile Agent Submissions Queue */}
      {mobileAgentSubmissions.length > 0 && (
        <Card className="bg-[color:var(--console-dark)] border border-white/5">
          <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
            <CardTitle className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-mobile-alt text-white" aria-hidden />
              </div>
              <span className="card-title-text">Pending Mobile Agent Submissions ({mobileAgentSubmissions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mobileAgentSubmissions.map((submission) => (
                <div 
                  key={submission.submission_id}
                  className="p-4 border border-blue-500/20 rounded-md bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <i className="fas fa-mobile-alt mr-1" />
                          {submission.submission_type.replace('_', ' ')}
                        </span>
                        <span className={cn(
                          "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border",
                          submission.status === 'pending' ? "text-yellow-300 bg-yellow-500/20 border-yellow-500/30" :
                          submission.status === 'processed' ? "text-green-300 bg-green-500/20 border-green-500/30" :
                          "text-red-300 bg-red-500/20 border-red-500/30"
                        )}>
                          {submission.status}
                        </span>
                      </div>
                      <h4 className="font-black text-white mb-1">
                        Agent {submission.agent_id.slice(0, 8)} - {submission.submission_type.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-slate-400 mb-2">
                        {submission.visitor_id ? `Visitor ID: ${submission.visitor_id}` : 'New visitor registration'}
                      </p>
                      <div className="text-[10px] text-[color:var(--text-sub)]">
                        <i className="fas fa-clock mr-1" />
                        {new Date(submission.timestamp).toLocaleString()}
                        {submission.location != null && (
                          <>
                            <i className="fas fa-map-marker-alt ml-3 mr-1" />
                            GPS: {formatLocationDisplay(submission.location)}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {submission.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processAgentSubmission(submission.submission_id, 'approve')}
                          disabled={loading.agentSubmissions}
                          className="text-[9px] font-black uppercase tracking-widest border-green-500/30 text-green-300 hover:bg-green-500/10"
                        >
                          <i className="fas fa-check mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectSubmission(submission.submission_id)}
                          disabled={loading.agentSubmissions}
                          className="text-[9px] font-black uppercase tracking-widest border-red-500/30 text-red-300 hover:bg-red-500/10"
                        >
                          <i className="fas fa-times mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traditional Security Requests - Gold Standard Pattern */}
      <Card className="bg-[color:var(--console-dark)] border border-white/5">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
              <i className="fas fa-shield-alt text-white" aria-hidden />
            </div>
            <span className="card-title-text">Security Clearance Requests ({allSecurityRequests.length})</span>
          </CardTitle>
        </CardHeader>
      <CardContent className="px-6 pb-6">
        {allSecurityRequests.length === 0 ? (
          <EmptyState
            icon="fas fa-shield-alt"
            title="No Pending Requests"
            description="Security protocol is green. No active clearance requests or incident reports detected."
            className="bg-black/20 border-dashed border-2 border-white/5"
          />
        ) : (
          <div className="space-y-4 mt-4">
            {allSecurityRequests.map(({ request, visitor }) => (
              <div
                key={request.id}
                className="p-5 rounded-md border border-white/5 bg-[color:var(--console-dark)]/30 hover:border-orange-500/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider border",
                        request.type === 'emergency_alert' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          request.type === 'incident_report' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                            request.type === 'access_request' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                              'text-slate-500 bg-white/5 border-white/5'
                      )}>
                        {request.type.replace('_', ' ')}
                      </span>
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider border",
                        request.priority === 'urgent' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          request.priority === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                            request.priority === 'normal' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                              'text-slate-500 bg-white/5 border-white/5'
                      )}>
                        {request.priority}
                      </span>
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider border",
                        request.status === 'pending' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          request.status === 'in_progress' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                            request.status === 'completed' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                              'text-slate-500 bg-white/5 border-white/5'
                      )}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-white font-black text-lg mb-1 leading-tight group-hover:text-blue-400 transition-colors">{request.description}</p>
                    <p className="text-sm text-[color:var(--text-sub)] italic font-medium">
                      Source: {visitor?.first_name} {visitor?.last_name}
                      {request.location && <> <span className="mx-2 opacity-30">•</span> Zone: {formatLocationDisplay(request.location)}</>}
                    </p>
                    {request.response && (
                      <div className="mt-4 p-3 bg-blue-500/5 rounded-md border border-blue-500/20 italic">
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
                        className="text-[10px] font-black uppercase tracking-widest px-6"
                      >
                        Assign Response
                      </Button>
                    )}
                    {request.status === 'in_progress' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComplete(request.id)}
                          className="text-[10px] font-black uppercase tracking-widest border-green-500/30 text-green-300 hover:bg-green-500/10"
                        >
                          <i className="fas fa-check mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRequest(request.id)}
                          className="text-[10px] font-black uppercase tracking-widest border-slate-400/30 text-slate-300 hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
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

SecurityRequestsTab.displayName = 'SecurityRequestsTab';
