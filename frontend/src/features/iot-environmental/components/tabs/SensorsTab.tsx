import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';
import { renderSensorIcon } from '../../utils/sensorIcons';
import { ConfirmDeleteSensorModal } from '../modals/ConfirmDeleteSensorModal';

const SensorsTab: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    statusFilter,
    setStatusFilter,
    selectedSensor,
    setSelectedSensor,
    uniqueSensors,
    filteredData,
    setShowAddModal,
    setViewingSensor,
    openEditModal,
    pendingDeleteSensorId,
    setPendingDeleteSensorId,
    handleDeleteSensor,
    getStatusBadge,
    getStatusColor,
    canManageSensors,
    sortBy,
    setSortBy,
  } = useIoTEnvironmentalContext();

  return (
    <div className="space-y-6" role="main" aria-label="Environmental sensors">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Sensors</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Environmental sensor registry and status
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                <i className="fas fa-wifi text-white" />
              </div>
              <span className="card-title-text">Sensor registry</span>
            </span>
            {canManageSensors && (
              <Button
                onClick={() => setShowAddModal(true)}
                variant="primary"
                className="h-10 px-6 font-black uppercase text-[10px] tracking-widest"
              >
                <i className="fas fa-plus mr-2 text-white" aria-hidden />
                Add sensor
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {/* Filter row (Patrol-style inside Card) */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              {['all', 'normal', 'warning', 'critical'].map((filter) => (
                <Button
                  key={filter}
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-colors",
                    statusFilter === filter
                      ? "bg-blue-600 hover:bg-blue-500 text-white border-none"
                      : "border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {filter}
                </Button>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedSensor}
                onChange={(e) => setSelectedSensor(e.target.value)}
                className="appearance-none bg-white/5 border border-white/5 rounded-md px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-widest text-white focus:ring-2 focus:ring-blue-500/20 outline-none hover:bg-white/10 transition-colors cursor-pointer"
              >
                <option value="" className="bg-slate-900">All sensors</option>
                {uniqueSensors.map(sensorId => (
                  <option key={sensorId} value={sensorId} className="bg-slate-900">{sensorId}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/5 border border-white/5 rounded-md px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-widest text-white focus:ring-2 focus:ring-blue-500/20 outline-none hover:bg-white/10 transition-colors cursor-pointer"
              >
                <option value="timestamp">Latest</option>
                <option value="id">ID</option>
                <option value="value">Value</option>
                <option value="status">Status</option>
              </select>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded border border-white/5">
                {filteredData.length} sensor{filteredData.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {filteredData.length === 0 ? (
            <EmptyState
              icon="fas fa-wifi"
              title="No sensors found"
              description="No active sensors match the current filters."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((sensor) => (
                <div
                  key={sensor.id}
                  className={cn(
                    'p-5 border rounded-md bg-slate-900/30 hover:border-indigo-500/20 transition-colors',
                    sensor.status === 'critical' && 'border-red-500/20 bg-red-500/5',
                    sensor.status === 'warning' && 'border-amber-500/20 bg-amber-500/5',
                    sensor.status === 'normal' && 'border border-white/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center border border-white/5",
                        sensor.status === 'critical' ? 'bg-red-600' :
                          sensor.status === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
                      )}>
                        {renderSensorIcon(sensor.sensor_type, 20)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{sensor.sensor_id}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sensor.sensor_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {getStatusBadge(sensor.status)}
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Value</span>
                      <span className={cn('text-lg font-black text-white', getStatusColor(sensor.status))}>
                        {sensor.value} {sensor.unit}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-0.5">Location</span>
                        <span className="text-white font-bold uppercase tracking-wider flex items-center">
                          <i className="fas fa-map-marker-alt mr-1.5 text-slate-500" aria-hidden />
                          {formatLocationDisplay(sensor.location as string | { lat?: number; lng?: number } | null) || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-0.5">Time</span>
                        <span className="text-white font-mono">
                          {new Date(sensor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-md border border-white/5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Threshold</span>
                      <span className="text-[10px] font-black text-white">
                        {sensor.threshold_min ?? '—'} – {sensor.threshold_max ?? '—'} {sensor.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingSensor(sensor)}
                      className="flex-1 font-black uppercase tracking-widest text-[10px] h-8 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                    >
                      <i className="fas fa-eye mr-2" aria-hidden />
                      View
                    </Button>
                    {canManageSensors && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(sensor)}
                          className="h-8 w-10 border-white/5 text-slate-500 hover:text-white"
                        >
                          <i className="fas fa-edit" aria-hidden />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingDeleteSensorId(sensor.sensor_id)}
                          className="h-8 w-10 border-white/5 text-red-500/80 hover:text-red-400 hover:border-red-500/30"
                        >
                          <i className="fas fa-trash" aria-hidden />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteSensorModal
        isOpen={!!pendingDeleteSensorId}
        onClose={() => setPendingDeleteSensorId(null)}
        onConfirm={async () => {
          if (!pendingDeleteSensorId) return;
          setIsDeleting(true);
          await handleDeleteSensor(pendingDeleteSensorId);
          setPendingDeleteSensorId(null);
          setIsDeleting(false);
        }}
        sensorId={pendingDeleteSensorId ?? ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default SensorsTab;

