import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';
import { renderSensorIcon } from '../../utils/sensorIcons';

const ViewSensorModal: React.FC = () => {
  const {
    viewingSensor,
    setViewingSensor,
    openEditModal,
    getStatusBadge,
    getStatusColor,
  } = useIoTEnvironmentalContext();

  if (!viewingSensor) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-black/40 border border-white/5 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden backdrop-blur-2xl transition-all scale-in-center">
        {/* Modal Header */}
        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full" />

          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
              {renderSensorIcon(viewingSensor.sensor_type, 24)}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                SENSOR DETAILS
              </h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">SENSOR DETAILS</p>
            </div>
          </div>

          <button
            onClick={() => setViewingSensor(null)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all group"
          >
            <i className="fas fa-times group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block">SENSOR ID</label>
                <p className="text-lg font-black text-white tracking-widest">{viewingSensor.sensor_id}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block">SENSOR TYPE</label>
                <p className="text-md font-bold text-blue-400 uppercase tracking-widest">{viewingSensor.sensor_type.replace('_', ' ')}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block">CURRENT VALUE</label>
                <p className={cn('text-3xl font-black tracking-tighter', getStatusColor(viewingSensor.status))}>
                  {viewingSensor.value} {viewingSensor.unit}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block">STATUS</label>
                <div className="inline-block mt-1">{getStatusBadge(viewingSensor.status)}</div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block">LOCATION</label>
                <p className="text-md font-bold text-white uppercase tracking-widest flex items-center">
                  <i className="fas fa-map-marker-alt mr-2 text-blue-500/60" />
                  {viewingSensor.location}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block">LAST UPDATE</label>
                <p className="text-sm font-bold text-white/80 uppercase flex items-center">
                  <i className="fas fa-clock mr-2 text-blue-500/60" />
                  {new Date(viewingSensor.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Threshold Section */}
            {(viewingSensor.threshold_min || viewingSensor.threshold_max) && (
              <div className="col-span-2 p-6 bg-white/5 border border-white/5 rounded-2xl">
                <div className="flex items-center space-x-3 mb-4">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">THRESHOLDS</h3>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1">MIN THRESHOLD</span>
                    <span className="text-lg font-black text-blue-400 tracking-widest">{viewingSensor.threshold_min || 'N/A'} {viewingSensor.unit}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1">MAX THRESHOLD</span>
                    <span className="text-lg font-black text-red-400 tracking-widest">{viewingSensor.threshold_max || 'N/A'} {viewingSensor.unit}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-end space-x-4">
          <Button
            variant="ghost"
            onClick={() => setViewingSensor(null)}
            className="bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] px-8 h-12"
          >
            CLOSE
          </Button>
          <Button
            onClick={() => {
              openEditModal(viewingSensor);
              setViewingSensor(null);
            }}
            variant="primary"
            className="font-black uppercase tracking-[0.2em] text-[10px] px-10 h-12 shadow-xl shadow-blue-500/20"
          >
            <i className="fas fa-edit mr-2" />
            EDIT SENSOR
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewSensorModal;

