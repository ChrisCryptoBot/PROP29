import React from 'react';
import { Card, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';
import { renderSensorIcon } from '../../utils/sensorIcons';

const SensorsTab: React.FC = () => {
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
    handleDeleteSensor,
    getStatusBadge,
    getStatusColor,
    canManageSensors,
    sortBy,
    setSortBy,
  } = useIoTEnvironmentalContext();

  return (
    <div className="space-y-6">
      {/* SOC-style Filtering Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 p-2 rounded-xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          {['all', 'normal', 'warning', 'critical'].map((filter) => (
            <Button
              key={filter}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(filter)}
              className={cn(
                "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all",
                statusFilter === filter
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                  : "border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              {filter}
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative group">
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-widest text-white/60 focus:ring-2 focus:ring-blue-500/50 outline-none hover:bg-white/10 transition-all cursor-pointer"
            >
              <option value="" className="bg-slate-900">ALL SENSORS</option>
              {uniqueSensors.map(sensorId => (
                <option key={sensorId} value={sensorId} className="bg-slate-900">{sensorId.toUpperCase()}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-[10px] pointer-events-none group-hover:text-white/40 transition-colors" />
          </div>

          <div className="relative group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-widest text-white/60 focus:ring-2 focus:ring-blue-500/50 outline-none hover:bg-white/10 transition-all cursor-pointer"
            >
              <option value="timestamp" className="bg-slate-900">SORT: LATEST</option>
              <option value="id" className="bg-slate-900">SORT: ID</option>
              <option value="value" className="bg-slate-900">SORT: VALUE</option>
              <option value="status" className="bg-slate-900">SORT: STATUS</option>
            </select>
            <i className="fas fa-sort-amount-down absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-[10px] pointer-events-none group-hover:text-white/40 transition-colors" />
          </div>

          {canManageSensors && (
            <Button
              onClick={() => setShowAddModal(true)}
              variant="primary"
              className="font-black uppercase tracking-widest text-[10px] px-6 h-9 shadow-lg shadow-blue-500/20"
            >
              <i className="fas fa-plus mr-2" />
              ADD SENSOR
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((sensor) => (
          <Card
            key={sensor.id}
            className={cn(
              'group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 border-white/10 bg-black/20 backdrop-blur-xl',
              sensor.status === 'critical' && 'border-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
              sensor.status === 'warning' && 'border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
            )}
          >
            {/* Background Glow Effect */}
            <div className={cn(
              "absolute -inset-1 opacity-10 blur-2xl transition-all duration-500 rounded-full scale-0 group-hover:scale-100",
              sensor.status === 'critical' ? 'bg-red-500' :
                sensor.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            )} />

            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                    sensor.status === 'critical' ? 'bg-red-500 text-white' :
                      sensor.status === 'warning' ? 'bg-yellow-500 text-white' : 'bg-white/5 border border-white/10 text-blue-500'
                  )}>
                    {renderSensorIcon(sensor.sensor_type, 20)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tighter">{sensor.sensor_id}</h4>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{sensor.sensor_type.replace('_', ' ')}</p>
                  </div>
                </div>
                {getStatusBadge(sensor.status)}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">TELEMETRY VALUE</span>
                  <span className={cn('text-lg font-black tracking-tighter', getStatusColor(sensor.status))}>
                    {sensor.value} {sensor.unit}
                  </span>
                </div>

                <div className="h-px bg-white/5" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] block">LOCATION</span>
                    <span className="text-[10px] font-black text-white/70 uppercase flex items-center">
                      <i className="fas fa-map-marker-alt mr-1.5 text-blue-500/60" />
                      {sensor.location}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] block">TIMESTAMP</span>
                    <span className="text-[10px] font-black text-white/70 uppercase flex items-center">
                      <i className="fas fa-clock mr-1.5 text-blue-500/60" />
                      {new Date(sensor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/5 h-10">
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">THRESHOLD RANGE</span>
                    <span className="text-[9px] font-black text-white/60">
                      {sensor.threshold_min || '--'} - {sensor.threshold_max || '--'} {sensor.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewingSensor(sensor)}
                  className="flex-1 font-black uppercase tracking-widest text-[9px] bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white"
                >
                  <i className="fas fa-eye mr-2" />
                  VIEW DETAILS
                </Button>
                {canManageSensors && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditModal(sensor)}
                      className="w-10 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white"
                    >
                      <i className="fas fa-edit" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSensor(sensor.id)}
                      className="w-10 bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30"
                    >
                      <i className="fas fa-trash" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="py-20">
          <EmptyState
            icon="fas fa-wifi"
            title="No Sensors Found"
            description="System hardware scan returned zero active sensors matching the current filters."
          />
        </div>
      )}
    </div>
  );
};

export default SensorsTab;

