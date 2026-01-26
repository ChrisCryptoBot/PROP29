import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { useIoTEnvironmentalContext } from '../../context/IoTEnvironmentalContext';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-black/40 border border-white/5 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-2xl transition-all scale-in-center">
        {/* Modal Header */}
        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full" />

          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
              <i className="fas fa-edit text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                EDIT SENSOR
              </h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">EDIT SENSOR</p>
            </div>
          </div>

          <button
            onClick={() => setShowEditModal(false)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all group"
          >
            <i className="fas fa-times group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Sensor ID</label>
            <input
              type="text"
              value={sensorForm.sensor_id}
              disabled
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-black text-white/40 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Location</label>
            <input
              type="text"
              value={sensorForm.location}
              onChange={(e) => setSensorForm({ ...sensorForm, location: e.target.value })}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:bg-white/10"
              placeholder="E.G., MAIN LOBBY"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Min Threshold</label>
              <input
                type="number"
                value={sensorForm.threshold_min}
                onChange={(e) => setSensorForm({ ...sensorForm, threshold_min: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:bg-white/10"
                placeholder="MIN"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Max Threshold</label>
              <input
                type="number"
                value={sensorForm.threshold_max}
                onChange={(e) => setSensorForm({ ...sensorForm, threshold_max: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-red-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:bg-white/10"
                placeholder="MAX"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-end space-x-4">
          <Button
            variant="ghost"
            onClick={() => setShowEditModal(false)}
            className="bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] px-8 h-12"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleEditSensor}
            variant="primary"
            className="font-black uppercase tracking-[0.2em] text-[10px] px-10 h-12 shadow-xl shadow-blue-500/20"
          >
            SAVE CHANGES
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditSensorModal;

