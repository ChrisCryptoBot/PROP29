/**
 * Badges & Access Tab
 * Tab for managing visitor badges and access points
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useVisitorContext } from '../../context/VisitorContext';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { cn } from '../../../../utils/cn';

export const BadgesAccessTab: React.FC = React.memo(() => {
  const {
    filteredVisitors,
    loading,
    setSelectedVisitor,
    setShowQRModal,
    setShowBadgeModal,
    // Hardware Integration
    hardwareDevices,
    printVisitorBadge,
    refreshHardwareDevices
  } = useVisitorContext();

  // Filter to only checked-in visitors
  const checkedInVisitors = React.useMemo(() => {
    return filteredVisitors.filter(v => v.status === 'checked_in');
  }, [filteredVisitors]);

  // Hardware device status analysis
  const hardwareStatus = React.useMemo(() => {
    const cardReaders = hardwareDevices.filter(d => d.device_type === 'card_reader');
    const printers = hardwareDevices.filter(d => d.device_type === 'printer');
    const cameras = hardwareDevices.filter(d => d.device_type === 'camera');
    
    return {
      cardReaders,
      printers,
      cameras,
      allDevicesOnline: hardwareDevices.every(d => d.status === 'online'),
      printersAvailable: printers.filter(p => p.status === 'online').length,
      cardReadersOnline: cardReaders.filter(cr => cr.status === 'online').length
    };
  }, [hardwareDevices]);

  const handlePrintBadge = async (visitorId: string) => {
    const availablePrinter = hardwareStatus.printers.find(p => p.status === 'online');
    if (availablePrinter) {
      await printVisitorBadge(visitorId, availablePrinter.device_id);
    } else {
      // Fallback to any printer
      await printVisitorBadge(visitorId);
    }
  };

  if (loading.visitors && checkedInVisitors.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-3xl text-[color:var(--text-sub)] mb-4" />
        <p className="text-[color:var(--text-sub)]">Synchronizing credential data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Hardware Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Visitor Security</p>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Badges & Access Control</h2>
          <p className="text-[11px] text-[color:var(--text-sub)]">
            Physical credential management, hardware integration, and sector access control.
          </p>
        </div>
        
        {/* Hardware Status Indicators */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded">
            <i className="fas fa-print text-orange-400 text-xs" />
            <span className="text-[9px] text-orange-300">{hardwareStatus.printersAvailable} Printers</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded">
            <i className="fas fa-credit-card text-blue-400 text-xs" />
            <span className="text-[9px] text-blue-300">{hardwareStatus.cardReadersOnline} Readers</span>
          </div>
          <Button
            onClick={() => refreshHardwareDevices()}
            variant="outline"
            size="sm"
            disabled={loading.hardwareDevices}
            className="text-[9px] font-black uppercase tracking-widest border-white/10 text-slate-300 hover:bg-white/5"
          >
            <i className={cn("fas fa-sync-alt mr-1", loading.hardwareDevices && "animate-spin")} />
            Refresh Hardware
          </Button>
        </div>
      </div>

      {/* Hardware Device Status Overview */}
      {hardwareDevices.length > 0 && (
        <Card className="glass-card border border-white/5 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-white">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-lg border border-white/5">
                <i className="fas fa-microchip text-white" />
              </div>
              <span className="uppercase tracking-tight">Hardware Device Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Badge Printers */}
              <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-orange-300 uppercase tracking-wide">Badge Printers</h3>
                  <span className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    {hardwareStatus.printers.length} Total
                  </span>
                </div>
                {hardwareStatus.printers.length === 0 ? (
                  <p className="text-[10px] text-slate-400">No printers configured</p>
                ) : (
                  <div className="space-y-2">
                    {hardwareStatus.printers.slice(0, 3).map((printer) => (
                      <div key={printer.device_id} className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300">{printer.device_name}</span>
                        <span className={cn(
                          "px-1 py-0.5 rounded font-bold uppercase",
                          printer.status === 'online' ? "text-green-300 bg-green-500/20" : "text-red-300 bg-red-500/20"
                        )}>
                          {printer.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Readers */}
              <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wide">Card Readers</h3>
                  <span className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {hardwareStatus.cardReaders.length} Total
                  </span>
                </div>
                {hardwareStatus.cardReaders.length === 0 ? (
                  <p className="text-[10px] text-slate-400">No card readers configured</p>
                ) : (
                  <div className="space-y-2">
                    {hardwareStatus.cardReaders.slice(0, 3).map((reader) => (
                      <div key={reader.device_id} className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300">{reader.device_name}</span>
                        <span className={cn(
                          "px-1 py-0.5 rounded font-bold uppercase",
                          reader.status === 'online' ? "text-green-300 bg-green-500/20" : "text-red-300 bg-red-500/20"
                        )}>
                          {reader.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cameras */}
              <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide">Photo Cameras</h3>
                  <span className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {hardwareStatus.cameras.length} Total
                  </span>
                </div>
                {hardwareStatus.cameras.length === 0 ? (
                  <p className="text-[10px] text-slate-400">No cameras configured</p>
                ) : (
                  <div className="space-y-2">
                    {hardwareStatus.cameras.slice(0, 3).map((camera) => (
                      <div key={camera.device_id} className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300">{camera.device_name}</span>
                        <span className={cn(
                          "px-1 py-0.5 rounded font-bold uppercase",
                          camera.status === 'online' ? "text-green-300 bg-green-500/20" : "text-red-300 bg-red-500/20"
                        )}>
                          {camera.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Visitor Credentials */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-emerald-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-id-badge text-white text-sm" />
            </div>
            Active Credentials & Sector Access ({checkedInVisitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {checkedInVisitors.length === 0 ? (
            <EmptyState
              icon="fas fa-id-badge"
              title="No Active Credentials in Registry"
              description="Security credentials are only generated for personnel with an active check-in status."
              className="bg-black/20 border-dashed border-2 border-white/10"
            />
          ) : (
            <div className="space-y-4 mt-4">
              {checkedInVisitors.map(visitor => (
                <div
                  key={visitor.id}
                  className="p-5 rounded-xl border border-[color:var(--border-subtle)]/20 bg-[color:var(--console-dark)]/20 group hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-[color:var(--text-main)] group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                        {visitor.first_name} {visitor.last_name}
                      </h4>
                      <p className="text-[10px] font-mono text-[color:var(--text-sub)]/60 mt-1 uppercase tracking-widest">
                        CREDENTIAL ID: {visitor.badge_id || 'PENDING'}
                      </p>
                      {visitor.event_name && (
                        <p className="text-[10px] font-black text-indigo-400 mt-2 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 w-fit">
                          {visitor.event_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVisitor(visitor);
                          setShowQRModal(true);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-main)]"
                      >
                        <i className="fas fa-qrcode mr-2" />
                        View QR
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintBadge(visitor.id)}
                        disabled={hardwareStatus.printersAvailable === 0 || loading.hardwareDevices}
                        className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-main)] disabled:opacity-50"
                      >
                        <i className="fas fa-print mr-2" />
                        {hardwareStatus.printersAvailable > 0 ? 'Print Badge' : 'No Printer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVisitor(visitor);
                          setShowBadgeModal(true);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest px-3 text-[color:var(--text-sub)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-main)]"
                      >
                        <i className="fas fa-id-card mr-2" />
                        Badge Preview
                      </Button>
                    </div>
                  </div>
                  {visitor.access_points && visitor.access_points.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[color:var(--border-subtle)]/10">
                      <p className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mb-3">Authorized Security Sectors</p>
                      <div className="flex flex-wrap gap-2">
                        {visitor.access_points.map(apId => (
                          <span key={apId} className="px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20">
                            SECTOR {apId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

BadgesAccessTab.displayName = 'BadgesAccessTab';
