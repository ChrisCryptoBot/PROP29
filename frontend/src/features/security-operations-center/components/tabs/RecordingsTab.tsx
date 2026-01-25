import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess } from '../../../../utils/toast';
import { cn } from '../../../../utils/cn';

export const RecordingsTab: React.FC = () => {
  const { recordings, loading, setSelectedRecording, canManageCameras } = useSecurityOperationsContext();
  const [search, setSearch] = useState('');
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [bulkExportLoading, setBulkExportLoading] = useState(false);

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

  const handleBulkExport = async () => {
    if (selectedRecordings.size === 0) return;
    
    setBulkExportLoading(true);
    const toastId = showLoading(`Preparing ${selectedRecordings.size} recordings for export...`);
    
    try {
      // Simulate export API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dismissLoadingAndShowSuccess(toastId, `Export initiated for ${selectedRecordings.size} recordings. Download will start shortly.`);
      setSelectedRecordings(new Set());
    } catch (error) {
      showError('Export failed. Please try again.');
    } finally {
      setBulkExportLoading(false);
    }
  };

  const handleSingleExport = async (recordingId: string, recordingName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const toastId = showLoading(`Exporting ${recordingName}...`);
    
    try {
      // Simulate single export API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dismissLoadingAndShowSuccess(toastId, `${recordingName} export ready for download.`);
    } catch (error) {
      showError('Export failed. Please try again.');
    }
  };

  const selectedCount = selectedRecordings.size;
  const allSelected = selectedCount === filteredRecordings.length && filteredRecordings.length > 0;

  if (loading.recordings && recordings.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Recordings">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Recordings</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic opacity-70 text-slate-400">
            Browse and download recorded footage
          </p>
        </div>
      </div>
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl font-black uppercase tracking-tighter text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-film text-white text-lg" />
            </div>
            Recordings Library
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1 group">
              <SearchBar
                className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-all rounded-xl pl-10"
                placeholder="Search recordings by camera or date..."
                value={search}
                onChange={setSearch}
              />
            </div>
            <Button
              variant="outline"
              className="font-black uppercase tracking-widest text-[10px] border-white/10 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white h-10 px-6"
              onClick={() => setSearch('')}
            >
              Clear
            </Button>
          </div>

          {/* Bulk Operations */}
          {filteredRecordings.length > 0 && (
            <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
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
                    className="font-black uppercase tracking-widest text-[10px] border-white/10 text-white/60 hover:bg-white/5"
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
                    "bg-white/5 border shadow-inner hover:bg-white/[0.08] transition-all cursor-pointer group rounded-2xl overflow-hidden relative",
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
                        <h4 className="font-black text-white uppercase tracking-tighter text-lg group-hover:text-blue-400 transition-colors">{recording.cameraName}</h4>
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

                  <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
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

            {/* Bulk Export Progress */}
            {bulkExportLoading && (
              <div className="col-span-full bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-blue-400 font-bold text-sm">Processing bulk export...</span>
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

