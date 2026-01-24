import React from 'react';
import { Card, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Progress } from '../../../../components/UI/Progress';
import { cn } from '../../../../utils/cn';
import { useEmergencyEvacuationContext } from '../../context/EmergencyEvacuationContext';

export const ActiveTab: React.FC = () => {
  const {
    floors,
    staff,
    guestAssistance,
    routes,
    activeStaff,
    pendingAssistance,
    loading,
    hasManagementAccess,
    getStatusBadgeClass,
    getRiskLevelBadgeClass,
    getPriorityBadgeClass,
    handleAssignAssistance,
    handleCompleteAssistance,
    handleViewRoute,
  } = useEmergencyEvacuationContext();

  return (
    <div className="space-y-8 pb-10">
      {/* Floor-by-Floor Status */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 mr-3">
              <i className="fas fa-building text-white" />
            </div>
            SECTOR STATUS LIST
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">REAL-TIME TELEMETRY</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {floors.map((floor) => (
            <div
              key={floor.id}
              className={cn(
                'group relative p-6 border rounded-2xl transition-all duration-300 backdrop-blur-xl bg-black/20',
                floor.riskLevel === 'critical' ? 'border-red-500/30' :
                  floor.riskLevel === 'high' ? 'border-orange-500/30' :
                    'border-white/10 hover:border-white/20'
              )}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tighter">{floor.name}</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 italic">{floor.description}</p>
                </div>
                <span className={cn('px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border', getStatusBadgeClass(floor.status))}>
                  {floor.status}
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                    <span className="text-white/20">CLEARANCE PROGRESS</span>
                    <span className="text-white font-black">{floor.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000",
                        floor.progress === 100 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                      )}
                      style={{ width: `${floor.progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/[0.03] rounded border border-white/5">
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1 leading-none">PERSONNEL</p>
                    <p className="text-xl font-black text-white tracking-tighter leading-none">{floor.guestCount}</p>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded border border-white/5">
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1 leading-none">STAFF</p>
                    <p className="text-xl font-black text-white tracking-tighter leading-none">{floor.assignedStaff}</p>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">DESIGNATED EXIT</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">{floor.exitRoute}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">RISK ASSESSMENT</span>
                    <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border', getRiskLevelBadgeClass(floor.riskLevel))}>
                      {floor.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Staff Deployment */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3 px-1">
          <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">PROTOCOL DEPLOYMENT UNITS</h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div key={member.id} className="p-4 bg-black/20 border border-white/10 rounded-xl hover:bg-white/[0.05] transition-all backdrop-blur-sm group">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-blue-500 font-black text-xs uppercase">{member.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-white uppercase tracking-tight truncate">{member.name}</h4>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest truncate">{member.role}</p>
                </div>
                <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border', getStatusBadgeClass(member.status))}>
                  {member.status}
                </span>
              </div>
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-white/10">VECTOR</span>
                  <span className="text-white/60 tracking-tight">{member.location}</span>
                </div>
                {member.assignedFloor && (
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                    <span className="text-white/10">ASSIGNMENT</span>
                    <span className="text-white/60 tracking-tight">{member.assignedFloor}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-white/10">CLEARANCE</span>
                  <span className="text-blue-500 font-black">{member.guestsAssisted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guest Assistance Requests (Active Intervention) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center">
            <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-500/20 mr-3">
              <i className="fas fa-life-ring text-white" />
            </div>
            ACTIVE INTERVENTION LOG
          </h2>
          <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full">
            {pendingAssistance.length} PENDING RESPONSES
          </span>
        </div>

        <div className="space-y-3">
          {guestAssistance.map((request) => (
            <div
              key={request.id}
              className={cn(
                'p-6 border rounded-2xl transition-all duration-300 relative overflow-hidden bg-black/20 backdrop-blur-xl',
                request.priority === 'high' && request.status === 'pending' ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' :
                  request.priority === 'high' ? 'border-red-500/20' :
                    request.priority === 'medium' ? 'border-yellow-500/20' :
                      'border-white/10'
              )}
            >
              {request.priority === 'high' && request.status === 'pending' && (
                <div className="absolute -left-[2px] top-0 bottom-0 w-1 bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]" />
              )}

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className={cn('px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded border shadow-sm', getPriorityBadgeClass(request.priority))}>
                      {request.priority} PRIORITY
                    </span>
                    <span className={cn('px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded border shadow-sm', getStatusBadgeClass(request.status))}>
                      {request.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-tighter flex items-center">
                      <i className="fas fa-door-open mr-3 text-blue-500" />
                      UNIT {request.room}
                    </h4>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 italic">{request.guestName}</p>

                    <div className="mt-4 p-4 bg-white/[0.03] border border-white/5 rounded">
                      <p className="text-sm text-white/70 font-medium leading-relaxed max-w-2xl">{request.need}</p>
                    </div>
                  </div>
                  {request.assignedStaff && (
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        ASSIGNED UNIT: <span className="text-white/60 font-black">{request.assignedStaff}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-2 shrink-0">
                  {request.status === 'pending' && (
                    <Button
                      onClick={() => handleAssignAssistance(request.id, activeStaff[0]?.id)}
                      disabled={!hasManagementAccess || loading}
                      className="font-black uppercase tracking-widest text-[10px] h-12 px-8 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-500/20 group"
                    >
                      DEPLOY RESPONSE
                      <i className="fas fa-satellite-dish ml-3 group-hover:animate-ping" />
                    </Button>
                  )}
                  {request.status === 'assigned' && (
                    <Button
                      onClick={() => handleCompleteAssistance(request.id)}
                      disabled={!hasManagementAccess || loading}
                      className="font-black uppercase tracking-widest text-[10px] h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20"
                    >
                      <i className="fas fa-check-circle mr-3" />
                      SECURE UNIT
                    </Button>
                  )}
                  {request.status === 'completed' && (
                    <div className="h-12 px-8 flex items-center justify-center rounded bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-black uppercase tracking-widest">
                      <i className="fas fa-check-double mr-3" />
                      PROTOCOLS COMPLETED
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Evacuation Routes */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3 px-1">
          <h2 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">EXTENDED LOGISTICS CHANNELS</h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className={cn(
                'group p-6 border rounded-2xl transition-all duration-300 backdrop-blur-xl cursor-pointer bg-black/20',
                route.status === 'clear' ? 'border-green-500/30' :
                  route.status === 'congested' ? 'border-yellow-500/30' :
                    'border-red-500/30'
              )}
              onClick={() => handleViewRoute(route)}
            >
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex-1">
                  <h4 className="text-sm font-black text-white uppercase tracking-tighter">{route.name}</h4>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 italic">{route.description}</p>
                </div>
                <span className={cn('px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border', getStatusBadgeClass(route.status))}>
                  {route.status}
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-white/20">
                    <span>CAPACITY VECTOR</span>
                    <span className="text-white font-black">{route.currentOccupancy} / {route.capacity} UNITS</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000",
                        route.status === 'clear' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" :
                          route.status === 'congested' ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" :
                            "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                      )}
                      style={{ width: `${(route.currentOccupancy / route.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">EST. TRANSIT</span>
                    <span className="text-xs font-black text-blue-500 uppercase tracking-tighter">{route.estimatedTime}</span>
                  </div>
                  <Button
                    size="sm"
                    className="text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all h-8 px-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewRoute(route);
                    }}
                  >
                    <i className="fas fa-eye mr-2" />
                    VISUALIZE
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ActiveTab;

