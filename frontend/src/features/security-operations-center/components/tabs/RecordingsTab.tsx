import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { useSecurityOperationsTelemetry } from '../../hooks/useSecurityOperationsTelemetry';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import * as securityOpsService from '../../services/securityOperationsCenterService';
import { cn } from '../../../../utils/cn';
import type { ExportJob, BatchExportJob } from '../../services/securityOperationsCenterService';

export const RecordingsTab: React.FC = () => {
  const { recordings, loading, setSelectedRecording, canManageCameras } = useSecurityOperationsContext();
  const { trackAction } = useSecurityOperationsTelemetry();
  const [search, setSearch] = useState('');
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [bulkExportLoading, setBulkExportLoading] = useState(false);
  const [activeExports, setActiveExports] = useState<Map<string, ExportJob>>(new Map());
  const [activeBatchExports, setActiveBatchExports] = useState<Map<string, BatchExportJob>>(new Map());

  const filteredRecordings = useMemo(() => {
    if (!search.trim()) return recordings;
    const value = search.toLowerCase();
    return recordings.filter(
      (recording) =>
        recording.cameraName.toLowerCase().includes(value) ||
        recording.date.includes(value) ||
        recording.time.includes(value)
    );
  }, [recordings, search]);

  const handleSelectAll = () => {
    if (selectedRecordings.size === filteredRecordings.length) {
      setSelectedRecordings(new Set());
    } else {
      setSelectedRecordings(new Set(filteredRecordings.map(recording => recording.id)));
    }
  };

  const handleSelectRecording = (recordingId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelection = new Set(selectedRecordings);
    if (newSelection.has(recordingId)) {
      newSelection.delete(recordingId);
    } else {
      newSelection.add(recordingId);
    }
    setSelectedRecordings(newSelection);
  };

  // Poll export job status
  const pollExportStatus = useCallback(async (exportId: string) => {
    const job = await securityOpsService.getExportStatus(exportId);
    if (job) {
      setActiveExports(prev => {
        const updated = new Map(prev);
        updated.set(exportId, job);
        return updated;
      });

      if (job.status === 'completed' && job.download_url) {
        // Trigger download
        const downloadUrl = securityOpsService.getExportDownloadUrl(exportId);
        window.open(downloadUrl, '_blank');
        setActiveExports(prev => {
          const updated = new Map(prev);
          updated.delete(exportId);
          return updated;
        });
        return true;
      } else if (job.status === 'failed') {
        showError(`Export failed: ${job.error_message || 'Unknown error'}`);
        setActiveExports(prev => {
          const updated = new Map(prev);
          updated.delete(exportId);
          return updated;
        });
        return true;
      }
    }
    return false;
  }, []);

  // Poll batch export status
  const pollBatchExportStatus = useCallback(async (batchId: string) => {
    // Note: Backend doesn't have a batch status endpoint yet, so we'll check file existence
    // In production, add GET /exports/batch/{batch_id}/status endpoint
    const downloadUrl = securityOpsService.getBatchExportDownloadUrl(batchId);
    
    // Try to fetch the file to check if it's ready
    try {
      const response = await fetch(downloadUrl);
      if (response.ok) {
        // File is ready, trigger download
        window.open(downloadUrl, '_blank');
        setActiveBatchExports(prev => {
          const updated = new Map(prev);
          updated.delete(batchId);
          return updated;
        });
        return true;
      }
    } catch {
      // File not ready yet, continue polling
    }
    return false;
  }, []);

  // Polling effect for active exports
  useEffect(() => {
    if (activeExports.size === 0 && activeBatchExports.size === 0) return;

    const interval = setInterval(async () => {
      for (const [exportId] of activeExports) {
        await pollExportStatus(exportId);
      }
      for (const [batchId] of activeBatchExports) {
        await pollBatchExportStatus(batchId);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [activeExports, activeBatchExports, pollExportStatus, pollBatchExportStatus]);

  const handleBulkExport = async () => {
    if (selectedRecordings.size === 0) return;
    
    trackAction('bulk_export', 'recording', { count: selectedRecordings.size });
    setBulkExportLoading(true);
    const toastId = showLoading(`Preparing ${selectedRecordings.size} recordings for export...`);
    
    try {
      const recordingIds = Array.from(selectedRecordings);
      const batchResult = await securityOpsService.exportRecordingsBatch(recordingIds, 'mp4', 'high');
      
      if (batchResult) {
        if (batchResult.status === 'completed' && batchResult.download_url) {
          window.open(securityOpsService.getBatchExportDownloadUrl(batchResult.batch_id), '_blank');
          dismissLoadingAndShowSuccess(toastId, `Export complete. Download opened for ${selectedRecordings.size} recordings.`);
        } else {
          setActiveBatchExports(prev => {
            const updated = new Map(prev);
            updated.set(batchResult.batch_id, batchResult);
            return updated;
          });
          dismissLoadingAndShowSuccess(toastId, `Export initiated for ${selectedRecordings.size} recordings. Download will start when ready.`);
        }
        setSelectedRecordings(new Set());
      } else {
        throw new Error('Export initiation failed');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Export failed. Please try again.');
    } finally {
      setBulkExportLoading(false);
    }
  };

  const handleSingleExport = async (recordingId: string, recordingName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    trackAction('export', 'recording', { recordingId, recordingName });
    const toastId = showLoading(`Exporting ${recordingName}...`);
    try {
      const job = await securityOpsService.exportRecording(recordingId, 'mp4', 'high');
      if (!job) {
        dismissLoadingAndShowError(toastId, 'Export failed. Please try again.');
        return;
      }
      setActiveExports((prev) => {
        const next = new Map(prev);
        next.set(job.export_id, job);
        return next;
      });
      dismissLoadingAndShowSuccess(toastId, `Export started for ${recordingName}. Download will open when ready.`);
    } catch {
      dismissLoadingAndShowError(toastId, 'Export failed. Please try again.');
    }
  };

  const selectedCount = selectedRecordings.size;
  const allSelected = selectedCount === filteredRecordings.length && filteredRecordings.length > 0;

  if (loading.recordings && recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading recordings" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Recordings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Recordings">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Recordings</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Browse and download recorded footage
          </p>
        </div>
      </div>
      <Card className="bg-slate-900/50 border border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center">
            <div className="card-title-icon-box" aria-hidden="true">
              <i className="fas fa-film text-white" />
            </div>
            <span className="card-title-text">Recordings Library</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1 group">
              <SearchBar
                className="w-full bg-white/5 border-white/5 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-all rounded-md pl-10"
                placeholder="Search recordings by camera or date..."
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  if (value.trim()) {
                    trackAction('search', 'recording', { query: value });
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              className="font-black uppercase tracking-widest text-[10px] border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white h-10 px-6"
              onClick={() => setSearch('')}
            >
              Clear
            </Button>
          </div>

          {/* Bulk Operations */}
          {filteredRecordings.length > 0 && (
            <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-md border border-white/5">
              {/* Select All Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/20"
                />
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  {selectedCount > 0 ? `${selectedCount} Selected` : 'Select All'}
                </span>
              </label>

              {/* Bulk Export Button */}
              {selectedCount > 0 && canManageCameras && (
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkExportLoading}
                    onClick={handleBulkExport}
                    className="font-black uppercase tracking-widest text-[10px] border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                  >
                    <i className="fas fa-download mr-2" />
                    {bulkExportLoading ? 'Exporting...' : `Export ${selectedCount} Recording${selectedCount > 1 ? 's' : ''}`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRecordings(new Set())}
                    className="font-black uppercase tracking-widest text-[10px] border-white/5 text-white/60 hover:bg-white/5"
                  >
                    <i className="fas fa-times mr-2" />
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((recording) => {
              const isSelected = selectedRecordings.has(recording.id);
              return (
                <Card
                  key={recording.id}
                  className={cn(
                    "bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors cursor-pointer group rounded-md overflow-hidden relative",
                    isSelected ? "border-blue-500/40 bg-blue-500/5" : "border-white/5"
                  )}
                  onClick={() => setSelectedRecording(recording)}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRecording(recording.id, e as any)}
                          className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/20"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <h4 className="card-title-text">{recording.cameraName}</h4>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-black uppercase tracking-widest text-[9px] border-blue-500/20 text-blue-400 hover:bg-blue-500/10 h-7"
                        onClick={(e) => handleSingleExport(recording.id, recording.cameraName, e)}
                        aria-label="Export single recording"
                      >
                        <i className="fas fa-download mr-1.5" />
                        Export
                      </Button>
                    </div>

                  <div className="space-y-2 bg-black/40 p-3 rounded-md border border-white/5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Date/Time:</span>
                      <span className="text-white">{recording.date} · {recording.time}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">Duration:</span>
                      <span className="text-white">{recording.duration}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-sub)]">
                      <span className="opacity-50 text-white italic">File Size:</span>
                      <span className="text-white">{recording.size}</span>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs" />
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}

            {/* Active Export Jobs */}
            {activeExports.size > 0 && (
              <div className="col-span-full space-y-2">
                {Array.from(activeExports.values()).map(job => (
                  <div key={job.export_id} className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                      <div>
                        <span className="text-blue-400 font-bold text-sm">Exporting recording...</span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Status: {job.status} · Progress: {job.progress}%
                        </p>
                      </div>
                    </div>
                    {job.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          const downloadUrl = securityOpsService.getExportDownloadUrl(job.export_id);
                          window.open(downloadUrl, '_blank');
                        }}
                        className="text-[10px] font-black uppercase tracking-widest"
                      >
                        <i className="fas fa-download mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Active Batch Export Jobs */}
            {activeBatchExports.size > 0 && (
              <div className="col-span-full space-y-2">
                {Array.from(activeBatchExports.values()).map(batch => (
                  <div key={batch.batch_id} className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                      <div>
                        <span className="text-blue-400 font-bold text-sm">Batch Export Processing...</span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {batch.completed_count}/{batch.total_count} completed · {batch.failed_count} failed
                        </p>
                      </div>
                    </div>
                    {batch.status === 'completed' && batch.download_url && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          const downloadUrl = securityOpsService.getBatchExportDownloadUrl(batch.batch_id);
                          window.open(downloadUrl, '_blank');
                        }}
                        className="text-[10px] font-black uppercase tracking-widest"
                      >
                        <i className="fas fa-download mr-2" />
                        Download ZIP
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bulk Export Progress */}
            {bulkExportLoading && (
              <div className="col-span-full bg-blue-500/10 border border-blue-500/20 rounded-md p-4 flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-blue-400 font-bold text-sm">Initiating bulk export...</span>
              </div>
            )}

            {filteredRecordings.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon="fas fa-film"
                  title="No recordings found"
                  description="Try adjusting your search criteria or date filters."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

