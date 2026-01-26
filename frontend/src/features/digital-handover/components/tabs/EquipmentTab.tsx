/**
 * EquipmentTab Component
 * 
 * Tab for managing equipment status, tasks, and maintenance requests.
 * Uses the HandoverContext for data management.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { useHandoverContext } from '../../context/HandoverContext';
import { showSuccess } from '../../../../utils/toast';
import { EmptyState } from '../../../../components/UI/EmptyState';

export interface EquipmentTabProps {
  // Add any additional props if needed
}

/**
 * Equipment Tab Component
 */
export const EquipmentTab: React.FC<EquipmentTabProps> = () => {
  const { equipment, maintenanceRequests, loading, createMaintenanceRequest } = useHandoverContext();

  const handleCompleteTask = (task: string) => {
    showSuccess(`${task} marked as completed`);
    // TODO: Implement task completion logic via backend when available
  };

  const handleNotifyMaintenance = async (requestId: string) => {
    try {
      // TODO: Implement notification logic via backend when available
      showSuccess('Maintenance team notified');
    } catch (error) {
      console.error('Failed to notify maintenance:', error);
    }
  };

  // Calculate equipment status overview from equipment data
  const equipmentOverview = React.useMemo(() => {
    const equipmentByCategory = equipment.reduce(
      (acc, item) => {
        const category = item.category || 'Other';
        if (!acc[category]) {
          acc[category] = { total: 0, operational: 0 };
        }
        acc[category].total++;
        if (item.status === 'operational') {
          acc[category].operational++;
        }
        return acc;
      },
      {} as Record<string, { total: number; operational: number }>
    );

    return Object.entries(equipmentByCategory).map(([category, stats]) => ({
      name: category,
      count: stats.total,
      operational: stats.operational,
      icon: getCategoryIcon(category),
    }));
  }, [equipment]);

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      'Security Cameras': 'fa-video',
      'Access Control': 'fa-door-closed',
      'Fire Alarms': 'fa-fire-extinguisher',
      'Communication': 'fa-walkie-talkie',
      default: 'fa-cog',
    };
    return iconMap[category] || iconMap.default;
  };

  // Get pending tasks from maintenance requests
  const pendingTasks = React.useMemo(() => {
    return maintenanceRequests
      .filter((req) => req.status === 'pending' || req.status === 'in_progress')
      .map((req) => ({
        id: req.id,
        description: req.description || req.title || 'Maintenance request',
        location: req.location || 'Unknown',
        priority: req.priority,
        category: (req as any).equipmentCategory || 'General',
      }));
  }, [maintenanceRequests]);

  return (
    <div className="space-y-6">
      {/* Equipment Status Overview */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-700 to-cyan-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-clipboard-check text-white text-sm" />
            </div>
            Equipment Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          {loading.equipment ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
              <p className="text-[color:var(--text-sub)]">Loading equipment status...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {equipmentOverview.length > 0 ? (
                equipmentOverview.map((equip, index) => (
                  <div key={index} className="p-4 border border-[color:var(--border-subtle)]/30 rounded-lg bg-[color:var(--background-base)]/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-[color:var(--surface-highlight)] rounded-lg flex items-center justify-center border border-white/5">
                        <i className={`fas ${equip.icon} text-[color:var(--text-sub)]`} />
                      </div>
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border',
                          equip.operational === equip.count
                            ? 'text-green-400 bg-green-500/10 border-green-500/20'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        )}
                      >
                        {equip.operational}/{equip.count}
                      </span>
                    </div>
                    <h4 className="font-bold text-[color:var(--text-main)] text-sm">{equip.name}</h4>
                    <p className="text-[10px] text-[color:var(--text-sub)] mt-1 uppercase tracking-wide opacity-80">
                      {equip.operational === equip.count
                        ? 'All Operational'
                        : `${equip.count - equip.operational} Issue(s)`}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-4">
                  <EmptyState
                    icon="fas fa-tools"
                    title="No Equipment Data"
                    description="No equipment inventory found in the system."
                    className="bg-black/20 border-dashed border-2 border-white/5"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-tasks text-white text-sm" />
              </div>
              Pending Tasks
            </div>
            <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              {pendingTasks.length} Open
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <div className="space-y-4">
            {pendingTasks.length === 0 ? (
              <EmptyState
                icon="fas fa-check-double"
                title="All Tasks Completed"
                description="There are no pending tasks at this time."
                className="bg-black/20 border-dashed border-2 border-white/5"
              />
            ) : (
              pendingTasks.map((task) => (
                <div key={task.id} className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[color:var(--text-main)] text-sm">{task.description}</h4>
                    <p className="text-xs text-[color:var(--text-sub)] mt-1 font-mono opacity-80">
                      Location: {task.location} | Priority: {task.priority}
                    </p>
                    <p className="text-[10px] text-[color:var(--text-sub)] mt-1 uppercase tracking-wider opacity-60">Category: {task.category}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/30 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 uppercase tracking-wider text-[10px] font-bold"
                      onClick={() => handleCompleteTask(task.description)}
                    >
                      <i className="fas fa-check mr-2" />
                      Complete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Checklist */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-list-check text-white text-sm" />
            </div>
            Standard Equipment Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <div className="space-y-3">
            {[
              { item: 'Security patrol completed', category: 'Security', completed: true },
              { item: 'All cameras functional', category: 'Equipment', completed: true },
              { item: 'Communication devices charged', category: 'Equipment', completed: true },
              { item: 'Access control systems verified', category: 'Security', completed: true },
              { item: 'Fire alarm system tested', category: 'Safety', completed: false },
              { item: 'Emergency exits clear', category: 'Safety', completed: true },
              { item: 'Incident reports filed', category: 'Documentation', completed: true },
              { item: 'Equipment logs updated', category: 'Documentation', completed: false },
            ].map((item, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between transition-all",
                  item.completed
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-[color:var(--border-subtle)]/30 bg-[color:var(--background-base)]/30'
                )}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border",
                      item.completed
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-slate-500/10 border-slate-500/30 text-transparent'
                    )}
                  >
                    {item.completed && <i className="fas fa-check text-[10px]" />}
                  </div>
                  <div>
                    <h5 className={cn(
                      "font-medium text-sm transition-colors",
                      item.completed ? "text-green-400/80 line-through" : "text-[color:var(--text-main)]"
                    )}>{item.item}</h5>
                    <p className="text-[10px] text-[color:var(--text-sub)] uppercase tracking-wider opacity-60">{item.category}</p>
                  </div>
                </div>
                {!item.completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => handleCompleteTask(item.item)}
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Requests */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-wrench text-white text-sm" />
            </div>
            Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceRequests.length === 0 ? (
              <div className="col-span-2">
                <EmptyState
                  icon="fas fa-tools"
                  title="No Maintenance Requests"
                  description="All equipment is fully operational."
                  className="bg-black/20 border-dashed border-2 border-white/5"
                />
              </div>
            ) : (
              maintenanceRequests.slice(0, 6).map((request) => (
                <div key={request.id} className="p-4 border border-[color:var(--border-subtle)]/30 rounded-lg bg-[color:var(--background-base)]/50">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border',
                        request.priority === 'critical'
                          ? 'text-red-400 bg-red-500/10 border-red-500/20'
                          : request.priority === 'high'
                            ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                            : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                      )}
                    >
                      {request.priority.toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border',
                        request.status === 'in_progress'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                      )}
                    >
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-[color:var(--text-main)] text-sm">{request.title || request.description}</h4>
                  {request.location && (
                    <p className="text-xs text-[color:var(--text-sub)] mt-1">
                      <i className="fas fa-map-marker-alt mr-1" />
                      {request.location}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => handleNotifyMaintenance(request.id)}
                  >
                    <i className="fas fa-bell mr-2" />
                    Notify Maintenance
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
