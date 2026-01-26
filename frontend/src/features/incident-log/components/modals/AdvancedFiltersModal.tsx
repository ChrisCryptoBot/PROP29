import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { showError, showSuccess } from '../../../../utils/toast';

interface AdvancedFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({ isOpen, onClose }) => {
    const {
        refreshIncidents,
    } = useIncidentLogContext();

    const [filterName, setFilterName] = useState('');
    const [filters, setFilters] = useState({
        severity: 'all',
        status: 'all',
        startDate: '',
        endDate: ''
    });
    const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: typeof filters }>>(() => {
        const saved = localStorage.getItem('incident-log-saved-filters');
        return saved ? JSON.parse(saved) : [];
    });

    // Load saved filters from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('incident-log-saved-filters');
        if (saved) {
            try {
                setSavedFilters(JSON.parse(saved));
            } catch {
                setSavedFilters([]);
            }
        }
    }, []);

    // Save filters to localStorage when they change
    useEffect(() => {
        localStorage.setItem('incident-log-saved-filters', JSON.stringify(savedFilters));
    }, [savedFilters]);

    const handleSaveFilter = () => {
        if (!filterName.trim()) {
            showError('Please enter a name for this filter.');
            return;
        }
        const newFilter = { name: filterName.trim(), filters };
        setSavedFilters(prev => [...prev.filter(f => f.name !== filterName.trim()), newFilter]);
        setFilterName('');
        showSuccess(`Filter "${filterName.trim()}" saved.`);
    };

    const handleLoadFilter = (savedFilter: typeof filters) => {
        setFilters(savedFilter);
        showSuccess('Filter loaded.');
    };

    const handleDeleteFilter = (name: string) => {
        setSavedFilters(prev => prev.filter(f => f.name !== name));
        showSuccess(`Filter "${name}" deleted.`);
    };

    if (!isOpen) return null;

    const handleApplyFilters = async () => {
        // Date range validation
        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            if (start > end) {
                showError('Start date must be before end date.');
                return;
            }
        }

        const apiFilters: any = {};
        if (filters.severity !== 'all') apiFilters.severity = filters.severity;
        if (filters.status !== 'all') apiFilters.status = filters.status;
        if (filters.startDate) apiFilters.start_date = filters.startDate;
        if (filters.endDate) apiFilters.end_date = filters.endDate;

        await refreshIncidents(apiFilters);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Advanced Filters"
            size="lg"
            footer={(
                <>
                    <Button
                        variant="subtle"
                        onClick={onClose}
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApplyFilters}
                        variant="glass"
                        className="text-[9px] font-black uppercase tracking-widest"
                    >
                        <i className="fas fa-filter mr-2" />
                        Apply Filters
                    </Button>
                </>
            )}
        >
            <div className="space-y-6">
                    {/* Saved Filters */}
                    {savedFilters.length > 0 && (
                        <div>
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-4">Saved Filters</h3>
                            <div className="space-y-2">
                                {savedFilters.map((saved, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                                        <span className="text-sm text-white">{saved.name}</span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleLoadFilter(saved.filters)}
                                                className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                                            >
                                                Load
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteFilter(saved.name)}
                                                className="text-[9px] font-black uppercase tracking-widest border-red-500/30 text-red-300 hover:bg-red-500/10"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Filter Builder */}
                    <div>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-4">Filter Options</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Severity</label>
                                    <select
                                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                        value={filters.severity}
                                        onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                                    >
                                        <option value="all" className="bg-slate-900">All</option>
                                        <option value="CRITICAL" className="bg-slate-900">Critical</option>
                                        <option value="HIGH" className="bg-slate-900">High</option>
                                        <option value="MEDIUM" className="bg-slate-900">Medium</option>
                                        <option value="LOW" className="bg-slate-900">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Status</label>
                                    <select
                                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="all" className="bg-slate-900">All</option>
                                        <option value="active" className="bg-slate-900">Active</option>
                                        <option value="investigating" className="bg-slate-900">Investigating</option>
                                        <option value="resolved" className="bg-slate-900">Resolved</option>
                                        <option value="escalated" className="bg-slate-900">Escalated</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Date Range</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                    />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Save Filter */}
                    <div>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-4">Save Filter Preset</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                placeholder="Enter filter name..."
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                            />
                            <Button
                                onClick={handleSaveFilter}
                                variant="outline"
                                className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                            >
                                <i className="fas fa-save mr-2" />
                                Save
                            </Button>
                        </div>
                    </div>
            </div>
        </Modal>
    );
};

export default AdvancedFiltersModal;



