import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500 disabled:opacity-60 disabled:cursor-not-allowed';

const EditSensorModal: React.FC = () => {
  const {
    editingSensor,
    sensorForm,
    setSensorForm,
    setShowEditModal,
    handleEditSensor,
  } = useIoTEnvironmentalContext();

  if (!editingSensor) return null;

  return (
    <Modal
      isOpen={!!editingSensor}
      onClose={() => setShowEditModal(false)}
      title={`Edit sensor: ${sensorForm.sensor_id}`}
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSensor}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Sensor ID</label>
          <input
            type="text"
            value={sensorForm.sensor_id}
            disabled
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Location</label>
          <input
            type="text"
            value={sensorForm.location}
            onChange={(e) => setSensorForm({ ...sensorForm, location: e.target.value })}
            className={inputClass}
            placeholder="e.g. Main lobby"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Min threshold</label>
            <input
              type="number"
              value={sensorForm.threshold_min}
              onChange={(e) => setSensorForm({ ...sensorForm, threshold_min: e.target.value })}
              className={inputClass}
              placeholder="Min"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Max threshold</label>
            <input
              type="number"
              value={sensorForm.threshold_max}
              onChange={(e) => setSensorForm({ ...sensorForm, threshold_max: e.target.value })}
              className={inputClass}
              placeholder="Max"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditSensorModal;
