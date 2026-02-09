/**
 * Events Tab
 * Tab for managing events and event badges
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Select } from '../../../../components/UI/Select';
import { useVisitorContext } from '../../context/VisitorContext';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../utils/formatLocation';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const EventsTab: React.FC = React.memo(() => {
  const {
    events,
    loading,
    setSelectedEvent,
    setShowEventModal,
    setShowEventDetailsModal
  } = useVisitorContext();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Paginated events
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return events.slice(start, end);
  }, [events, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(events.length / itemsPerPage);

  if (loading.events && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12" role="status" aria-label="Loading events">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Retrieving event profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Gold Standard */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Event Security Coordination</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
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

      <Card className="bg-[color:var(--console-dark)] border border-white/5">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-calendar-alt text-white" />
              </div>
              <span className="card-title-text">Active Event Profiles</span>
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEvents.map(event => (
              <Card
                key={event.id}
                className="bg-[color:var(--console-dark)]/50 border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer group relative overflow-hidden"
                onClick={() => {
                  setSelectedEvent(event);
                  setShowEventDetailsModal(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="card-title-text">{event.name}</h4>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1">{event.type}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/20">
                      ACTIVE
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-slate-500 uppercase font-bold tracking-tighter text-[10px]">Location</span>
                      <span className="font-black text-white">{formatLocationDisplay(event.location)}</span>
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

            {/* Pagination Controls */}
            {events.length > 0 && totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">
                  Showing <span className="text-[color:var(--text-main)]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="text-[color:var(--text-main)]">{Math.min(currentPage * itemsPerPage, events.length)}</span> of{' '}
                  <span className="text-[color:var(--text-main)]">{events.length}</span> events
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-[10px] font-black uppercase tracking-widest border-white/5"
                    aria-label="Previous page"
                  >
                    <i className="fas fa-chevron-left mr-1" aria-hidden />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'primary' : 'glass'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="text-[10px] font-black uppercase tracking-widest min-w-[2rem]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="text-[10px] font-black uppercase tracking-widest border-white/5"
                    aria-label="Next page"
                  >
                    Next
                    <i className="fas fa-chevron-right ml-1" aria-hidden />
                  </Button>
                  <Select
                    id="items-per-page"
                    value={itemsPerPage.toString()}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest w-20 ml-2"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Select>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </div>
  );
});

EventsTab.displayName = 'EventsTab';
