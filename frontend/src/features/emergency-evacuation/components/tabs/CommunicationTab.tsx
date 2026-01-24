import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import { showSuccess } from '../../../../utils/toast';
import { useEmergencyEvacuationContext } from '../../context/EmergencyEvacuationContext';

const CommunicationTab: React.FC = () => {
  const {
    communicationLogs,
    loading,
    hasManagementAccess,
    handleAllCallAnnouncement,
    handleSendGuestNotifications,
    handleContactEmergencyServices,
  } = useEmergencyEvacuationContext();

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-broadcast-tower text-blue-500 text-lg" />
            </div>
            Protocol Communication Center
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Public Announcements */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-bullhorn text-blue-500 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Public Address</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Broadcast Emergency Audio</p>
                </div>
                <Button
                  onClick={handleAllCallAnnouncement}
                  disabled={!hasManagementAccess || loading}
                  className="w-full font-black uppercase tracking-widest text-[10px] h-10"
                >
                  INITIALIZE PA
                </Button>
              </div>
            </div>

            {/* Guest Notifications */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-bell text-green-500 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Guest Push</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Mobile Device Alerts</p>
                </div>
                <Button
                  onClick={handleSendGuestNotifications}
                  disabled={!hasManagementAccess || loading}
                  className="w-full font-black uppercase tracking-widest text-[10px] h-10"
                >
                  DISSEMINATE
                </Button>
              </div>
            </div>

            {/* Emergency Services */}
            <div className="group relative p-6 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-phone text-red-500 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">First Response</h3>
                  <p className="text-[10px] font-bold text-red-500/40 uppercase tracking-widest mt-1 font-black">Direct Service Link</p>
                </div>
                <Button
                  onClick={handleContactEmergencyServices}
                  disabled={!hasManagementAccess || loading}
                  className="w-full font-black uppercase tracking-widest text-[10px] h-10 bg-red-600 hover:bg-red-700 animate-pulse"
                >
                  CONTACT 911
                </Button>
              </div>
            </div>

            {/* Radio Communication */}
            <div className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-walkie-talkie text-purple-500 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Staff Radio</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Personnel Coordination</p>
                </div>
                <Button
                  onClick={() => showSuccess('Radio channel active')}
                  className="w-full font-black uppercase tracking-widest text-[10px] h-10 bg-purple-600 hover:bg-purple-700"
                >
                  OPEN CHANNEL
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Logs */}
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardHeader className="border-b border-white/5 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-white uppercase tracking-tighter">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <i className="fas fa-history text-blue-500 text-lg" />
            </div>
            Transmission History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-1">
            {communicationLogs.map((log) => (
              <div
                key={log.id}
                className="group flex items-center justify-between p-4 bg-white/[0.02] border border-transparent hover:bg-white/5 hover:border-white/5 rounded-xl transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded flex items-center justify-center border',
                      log.type === 'announcement' && 'bg-blue-500/10 border-blue-500/20 text-blue-500',
                      log.type === 'notification' && 'bg-green-500/10 border-green-500/20 text-green-500',
                      log.type === 'emergency-call' && 'bg-red-500/10 border-red-500/20 text-red-500',
                      log.type === 'radio' && 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                    )}
                  >
                    {log.type === 'announcement' && <i className="fas fa-bullhorn" />}
                    {log.type === 'notification' && <i className="fas fa-bell" />}
                    {log.type === 'emergency-call' && <i className="fas fa-phone" />}
                    {log.type === 'radio' && <i className="fas fa-walkie-talkie" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{log.message}</p>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Target: {log.recipients}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] italic leading-none">{log.timestamp}</p>
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border',
                      log.status === 'sent' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    )}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
            {communicationLogs.length === 0 && (
              <div className="py-12 text-center">
                <i className="fas fa-inbox text-white/10 text-4xl mb-4" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No communication records found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationTab;

