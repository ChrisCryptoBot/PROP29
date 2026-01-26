/**
 * Smart Lockers - Reservations Tab
 * Displays all locker reservations
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { useSmartLockersContext } from '../../context/SmartLockersContext';
import { getReservationStatusBadgeClass } from '../../utils/badgeHelpers';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const ReservationsTab: React.FC = () => {
  const { reservations, loading } = useSmartLockersContext();

  if (loading.reservations) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] group">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-lg group-hover:scale-110 transition-transform" aria-hidden="true">
              <i className="fas fa-calendar text-white text-lg" />
            </div>
            Locker Reservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="p-6 border border-white/5 bg-white/5 rounded-2xl hover:bg-white/[0.08] transition-all group shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <i className="fas fa-user text-blue-400" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">{reservation.guestName}</h3>
                  </div>
                  <span className={cn("px-2.5 py-1 text-xs font-black rounded uppercase tracking-widest", getReservationStatusBadgeClass(reservation.status))}>
                    {reservation.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Locker ID</span>
                    <p className="text-sm font-black text-white uppercase tracking-widest mt-1">L{reservation.lockerId}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Start Time</span>
                    <p className="text-sm font-black text-white uppercase tracking-widest mt-1">{new Date(reservation.startTime).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-sub)]">Purpose</span>
                    <p className="text-sm font-black text-white uppercase tracking-widest mt-1">{reservation.purpose}</p>
                  </div>
                </div>
              </div>
            ))}
            {reservations.length === 0 && (
              <EmptyState
                icon="fas fa-calendar-times"
                title="No reservations found"
                description="System registry is currently empty. No active or upcoming reservations detected in the ledger."
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

