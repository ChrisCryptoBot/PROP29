/**
 * Events Tab
 * Tab for managing events and event badges
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const EventsTab: React.FC = React.memo(() => {
  const {
    events,
    loading,
    setSelectedEvent,
    setShowEventModal,
    setShowEventDetailsModal
  } = useVisitorContext();

  if (loading.events && events.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
        <p className="text-[color:var(--text-sub)]">Retrieving event profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Gold Standard Structure */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visitor Security</p>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Event Security Coordination</h2>
          <p className="text-[11px] text-slate-400">
            Large-scale event management with mobile agent coordination and hardware-integrated access control.
          </p>
        </div>
        
        <Button
          onClick={() => setShowEventModal(true)}
          variant="glass"
          className="text-xs font-black uppercase tracking-widest px-6"
        >
          <i className="fas fa-plus mr-2" />
          Initialize Event
        </Button>
      </div>

      <Card className="glass-card border border-white/5 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl text-white font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center mr-3">
                <i className="fas fa-calendar-alt text-white text-sm" />
              </div>
              Active Event Profiles
            </CardTitle>
          </div>
        </CardHeader>
      <CardContent className="px-6 pb-6 mt-6">
        {events.length === 0 ? (
          <EmptyState
            icon="fas fa-calendar-plus"
            title="No Active Event Profiles"
            description="Event monitoring is currently offline. Register a new event to begin site tracking."
            className="bg-black/20 border-dashed border-2 border-white/5"
            action={{
              label: "REGISTER EVENT",
              onClick: () => setShowEventModal(true),
              variant: 'outline'
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <Card
                key={event.id}
                className="bg-slate-900/30 border border-white/5 shadow-xl hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventDetailsModal(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-black text-white text-xl group-hover:text-blue-400 transition-colors uppercase tracking-tight">{event.name}</h4>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1">{event.type}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/20">
                      ACTIVE
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-slate-500 uppercase font-bold tracking-tighter text-[10px]">Location</span>
                      <span className="font-black text-white">{event.location}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-slate-500 uppercase font-bold tracking-tighter text-[10px]">Attendee Logistics</span>
                      <span className="font-black text-white">{event.expected_attendees} Pax</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-slate-500 uppercase font-bold tracking-tighter text-[10px]">QR Authentication</span>
                      <span className={cn(
                        "font-black uppercase tracking-widest",
                        event.qr_code_enabled ? "text-blue-400" : "text-slate-500"
                      )}>
                        {event.qr_code_enabled ? 'Enforced' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Security Badge Tiers</p>
                    <div className="flex flex-wrap gap-2">
                      {event.badge_types.map(badge => (
                        <span
                          key={badge.id}
                          className="px-2 py-1 text-[9px] font-black rounded uppercase tracking-wider border"
                          style={{ backgroundColor: `${badge.color}15`, color: badge.color, borderColor: `${badge.color}30` }}
                        >
                          {badge.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
});

EventsTab.displayName = 'EventsTab';
