import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';

const AddSensorModal: React.FC = () => {
  const {
    sensorForm,
    setSensorForm,
    setShowAddModal,
    handleAddSensor,
  } = useIoTEnvironmentalContext();

  return (
    <Modal
      isOpen
      onClose={() => setShowAddModal(false)}
      title="Add sensor"
      size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddSensor}>
            Add sensor
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
            onChange={(e) => setSensorForm({ ...sensorForm, sensor_id: e.target.value })}
            className={inputClass}
            placeholder="e.g. TEMP-001"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Type</label>
          <select
            value={sensorForm.sensor_type}
            onChange={(e) => setSensorForm({ ...sensorForm, sensor_type: e.target.value as any })}
            className={inputClass + ' appearance-none cursor-pointer'}
          >
            <option value="temperature" className="bg-slate-900">Temperature</option>
            <option value="humidity" className="bg-slate-900">Humidity</option>
            <option value="air_quality" className="bg-slate-900">Air quality</option>
            <option value="light" className="bg-slate-900">Light</option>
            <option value="noise" className="bg-slate-900">Noise</option>
            <option value="pressure" className="bg-slate-900">Pressure</option>
          </select>
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

export default AddSensorModal;
