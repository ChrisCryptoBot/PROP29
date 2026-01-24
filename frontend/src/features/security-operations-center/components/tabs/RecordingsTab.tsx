import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { useSecurityOperationsContext } from '../../context/SecurityOperationsContext';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { showError } from '../../../../utils/toast';

export const RecordingsTab: React.FC = () => {
  const { recordings, loading, setSelectedRecording } = useSecurityOperationsContext();
  const [search, setSearch] = useState('');

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((recording) => (
              <Card
                key={recording.id}
                className="bg-white/5 border border-white/5 shadow-inner hover:bg-white/[0.08] transition-all cursor-pointer group rounded-2xl overflow-hidden"
                onClick={() => setSelectedRecording(recording)}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-white uppercase tracking-tighter text-lg group-hover:text-blue-400 transition-colors">{recording.cameraName}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-black uppercase tracking-widest text-[9px] border-blue-500/20 text-blue-400 hover:bg-blue-500/10 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        showError('Export not yet available. Backend download coming soon.');
                      }}
                      aria-label="Download recording"
                    >
                      <i className="fas fa-download mr-1.5" />
                      Download
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
                </CardContent>
              </Card>
            ))}
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

