/**
 * EquipmentTab Component
 * 
 * Tab for managing equipment status, tasks, and maintenance requests.
 * Uses the HandoverContext for data management.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { useHandoverContext } from '../../context/HandoverContext';
import { showSuccess, showError } from '../../../../utils/toast';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { AddEquipmentModal } from '../modals/AddEquipmentModal';
import { CreateMaintenanceRequestModal } from '../modals/CreateMaintenanceRequestModal';
import type { CreateEquipmentRequest, CreateMaintenanceRequestRequest } from '../../types';

export interface EquipmentTabProps {
  // Add any additional props if needed
}

/**
 * Equipment Tab Component
 */
const STANDARD_CHECKLIST_ITEMS = [
  { item: 'Security patrol completed', category: 'Security' },
  { item: 'All cameras functional', category: 'Equipment' },
  { item: 'Communication devices charged', category: 'Equipment' },
  { item: 'Access control systems verified', category: 'Security' },
  { item: 'Fire alarm system tested', category: 'Safety' },
  { item: 'Emergency exits clear', category: 'Safety' },
  { item: 'Incident reports filed', category: 'Documentation' },
  { item: 'Equipment logs updated', category: 'Documentation' },
];

export const EquipmentTab: React.FC<EquipmentTabProps> = () => {
  const {
    equipment,
    maintenanceRequests,
    loading,
    createEquipment,
    createMaintenanceRequest,
    updateMaintenanceRequest,
    refreshEquipment,
  } = useHandoverContext();

  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);

  const [standardChecklistCompleted, setStandardChecklistCompleted] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem('digital-handover-equipment-checklist');
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        return new Set(arr);
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  });

  const persistChecklist = useCallback((next: Set<string>) => {
    setStandardChecklistCompleted(next);
    sessionStorage.setItem('digital-handover-equipment-checklist', JSON.stringify([...next]));
  }, []);

  const handleCompleteTask = async (task: { id: string; description: string }) => {
    try {
      await updateMaintenanceRequest(task.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      showSuccess(`Task completed: ${task.description}`);
    } catch (err) {
      ErrorHandlerService.logError(err instanceof Error ? err : new Error(String(err)), 'DigitalHandover:handleCompleteTask');
      showError('Failed to complete task');
    }
  };

  const handleNotifyMaintenance = async (requestId: string, existingNotes?: string) => {
    try {
      const note = `[Maintenance team notified at ${new Date().toISOString()}]`;
      await updateMaintenanceRequest(requestId, {
        notes: (existingNotes || '').trim() ? `${existingNotes}\n${note}` : note,
      });
      showSuccess('Maintenance team notified');
    } catch (err) {
      ErrorHandlerService.logError(err instanceof Error ? err : new Error(String(err)), 'DigitalHandover:handleNotifyMaintenance');
      showError('Failed to send notification');
    }
  };

  const handleChecklistItemComplete = (itemLabel: string) => {
    persistChecklist(new Set([...standardChecklistCompleted, itemLabel]));
    showSuccess(`"${itemLabel}" marked complete`);
  };

  const handleAddEquipmentSubmit = async (data: CreateEquipmentRequest) => {
    await createEquipment(data);
    showSuccess('Equipment added');
    await refreshEquipment();
    setShowAddEquipment(false);
  };

  const handleCreateMaintenanceSubmit = async (data: CreateMaintenanceRequestRequest) => {
    await createMaintenanceRequest(data);
    showSuccess('Maintenance request created');
    await refreshEquipment();
    setShowAddMaintenance(false);
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
      security: 'fa-shield-alt',
      communication: 'fa-walkie-talkie',
      surveillance: 'fa-video',
      access_control: 'fa-door-closed',
      safety: 'fa-fire-extinguisher',
      maintenance: 'fa-wrench',
      other: 'fa-cog',
      Security: 'fa-shield-alt',
      Equipment: 'fa-cog',
      Safety: 'fa-fire-extinguisher',
      Documentation: 'fa-file-alt',
    };
    return iconMap[category] || iconMap.other || 'fa-cog';
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
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h2 className="page-title">Equipment & Tasks</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Equipment status and maintenance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-black uppercase tracking-widest text-[10px] border-white/5"
            onClick={() => setShowAddEquipment(true)}
          >
            <i className="fas fa-plus mr-2" aria-hidden />
            Add Equipment
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="font-black uppercase tracking-widest text-[10px]"
            onClick={() => setShowAddMaintenance(true)}
          >
            <i className="fas fa-wrench mr-2" aria-hidden />
            Create Maintenance Request
          </Button>
        </div>
      </div>

      {/* Compact metrics bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Equipment metrics">
        <span>Equipment <strong className="font-black text-white">{equipment.length}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Pending tasks <strong className="font-black text-white">{pendingTasks.length}</strong></span>
        <span className="text-white/30" aria-hidden="true">|</span>
        <span>Maintenance <strong className="font-black text-white">{maintenanceRequests.length}</strong></span>
      </div>

      {/* Equipment Status Overview */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="card-title-icon-box" aria-hidden="true">
              <i className="fas fa-clipboard-check text-white" />
            </div>
            <span className="card-title-text">Equipment Status Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          {loading.equipment ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4" role="status" aria-label="Loading equipment">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading equipment status...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {equipmentOverview.length > 0 ? (
                equipmentOverview.map((equip, index) => (
                  <div key={index} className="p-4 border border-white/5 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                        <i className={`fas ${equip.icon} text-white`} />
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
                    <h4 className="font-black text-[color:var(--text-main)] text-sm uppercase tracking-widest">{equip.name}</h4>
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
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-tasks text-white" />
              </div>
              <span className="card-title-text">Pending Tasks</span>
            </div>
            <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded text-amber-400 bg-amber-500/10 border border-amber-500/20 ">
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
                      Location: {formatLocationDisplay(task.location) || '—'} | Priority: {task.priority}
                    </p>
                    <p className="text-[10px] text-[color:var(--text-sub)] mt-1 uppercase tracking-wider opacity-60">Category: {task.category}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/30 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 uppercase tracking-wider text-[10px] font-bold"
                      onClick={() => handleCompleteTask({ id: task.id, description: task.description })}
                      aria-label={`Complete task: ${task.description}`}
                    >
                      <i className="fas fa-check mr-2" aria-hidden />
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
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="card-title-icon-box" aria-hidden="true">
              <i className="fas fa-list-check text-white" />
            </div>
            <span className="card-title-text">Standard Equipment Checklist</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <div className="space-y-3">
            {STANDARD_CHECKLIST_ITEMS.map((row, index) => {
              const completed = standardChecklistCompleted.has(row.item);
              return (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border flex items-center justify-between transition-colors",
                    completed ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-white/5'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center border",
                        completed ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-500/10 border-slate-500/30 text-transparent'
                      )}
                    >
                      {completed && <i className="fas fa-check text-[10px]" aria-hidden />}
                    </div>
                    <div>
                      <h5 className={cn(
                        "font-black text-sm uppercase tracking-wider",
                        completed ? "text-green-400/80 line-through" : "text-[color:var(--text-main)]"
                      )}>{row.item}</h5>
                      <p className="text-[10px] text-[color:var(--text-sub)] uppercase tracking-wider opacity-60">{row.category}</p>
                    </div>
                  </div>
                  {!completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => handleChecklistItemComplete(row.item)}
                      aria-label={`Mark ${row.item} complete`}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Requests */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="card-title-icon-box" aria-hidden="true">
              <i className="fas fa-wrench text-white" />
            </div>
            <span className="card-title-text">Maintenance Requests</span>
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
                <div key={request.id} className="p-4 border border-white/5 rounded-lg bg-white/5">
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
                  <h4 className="font-black text-[color:var(--text-main)] text-sm uppercase tracking-widest">{request.title || request.description}</h4>
                  {request.location && (
                    <p className="text-xs text-[color:var(--text-sub)] mt-1">
                      <i className="fas fa-map-marker-alt mr-1" />
                      {formatLocationDisplay(request.location) || '—'}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => handleNotifyMaintenance(request.id, request.notes)}
                    aria-label="Notify maintenance team"
                  >
                    <i className="fas fa-bell mr-2" aria-hidden />
                    Notify Maintenance
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddEquipmentModal
        isOpen={showAddEquipment}
        onClose={() => setShowAddEquipment(false)}
        onSubmit={handleAddEquipmentSubmit}
      />
      <CreateMaintenanceRequestModal
        isOpen={showAddMaintenance}
        onClose={() => setShowAddMaintenance(false)}
        onSubmit={handleCreateMaintenanceSubmit}
      />
    </div>
  );
};
