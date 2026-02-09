import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
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

  const handleEdit = () => {
    openEditModal(viewingSensor);
    setViewingSensor(null);
  };

  return (
    <Modal
      isOpen={!!viewingSensor}
      onClose={() => setViewingSensor(null)}
      title="Sensor details"
      size="md"
      footer={
        <>
          <Button variant="subtle" onClick={() => setViewingSensor(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            Edit sensor
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Sensor ID</p>
            <p className="text-white font-bold font-mono">{viewingSensor.sensor_id}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Type</p>
            <p className="text-white font-bold uppercase tracking-widest">{viewingSensor.sensor_type.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Current value</p>
            <p className={cn('text-2xl font-black text-white', getStatusColor(viewingSensor.status))}>
              {viewingSensor.value} {viewingSensor.unit}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
            <div className="mt-1">{getStatusBadge(viewingSensor.status)}</div>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Location</p>
            <p className="text-white font-bold">
              {formatLocationDisplay(viewingSensor.location as string | { lat?: number; lng?: number } | null) || '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Last update</p>
            <p className="text-white font-bold text-sm">{new Date(viewingSensor.timestamp).toLocaleString()}</p>
          </div>
        </div>
        {(viewingSensor.threshold_min || viewingSensor.threshold_max) && (
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Thresholds</p>
            <div className="grid grid-cols-2 gap-4">
              <p className="text-white font-bold">Min: {viewingSensor.threshold_min ?? 'N/A'} {viewingSensor.unit}</p>
              <p className="text-white font-bold">Max: {viewingSensor.threshold_max ?? 'N/A'} {viewingSensor.unit}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewSensorModal;
