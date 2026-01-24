import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { useEmergencyEvacuationContext } from '../../context/EmergencyEvacuationContext';

const AnnouncementModal: React.FC = () => {
  const {
    announcementText,
    setAnnouncementText,
    handleSendAnnouncement,
    setShowAnnouncementModal,
  } = useEmergencyEvacuationContext();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-bullhorn text-blue-500 text-lg"></i>
            </div>
            Protocol Announcement
          </h2>
          <button
            onClick={() => setShowAnnouncementModal(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-1">TRANSMISSION CONTENT</label>
            <div className="relative group">
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white font-medium text-sm focus:ring-1 focus:ring-blue-500/50 transition-all outline-none group-hover:border-white/20 placeholder:text-white/10"
                placeholder="ENTER ANNOUNCEMENT PAYLOAD..."
              />
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start space-x-4 group hover:bg-blue-500/10 transition-all duration-300">
            <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-info-circle text-blue-500 text-sm" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">SYSTEM NOTICE</p>
              <p className="text-xs text-white/60 leading-relaxed font-medium italic">
                Payload will be broadcast across all active PA channels and mobile uplink nodes globally.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/5 bg-white/[0.01]">
          <Button
            variant="outline"
            onClick={() => setShowAnnouncementModal(false)}
            className="px-6 h-12 font-black uppercase tracking-widest text-[10px] text-white/40 hover:text-white border-white/10 hover:bg-white/5"
          >
            ABORT
          </Button>
          <Button
            onClick={handleSendAnnouncement}
            className="px-8 h-12 font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all"
          >
            <i className="fas fa-signal mr-3 animate-pulse" />
            INITIALIZE BROADCAST
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;

