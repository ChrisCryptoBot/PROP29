/**
 * Advanced Filters Modal — Banned Individuals
 * Uses global Modal (UI gold standard).
 */

import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';
import { cn } from '../../../../utils/cn';

const GENDER_OPTIONS = [
    { value: 'ALL', label: 'All' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'UNKNOWN', label: 'Unknown' },
];

const BUILD_OPTIONS = [
    { value: 'ALL', label: 'All' },
    { value: 'SLIM', label: 'Slim' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HEAVY', label: 'Heavy' },
    { value: 'UNKNOWN', label: 'Unknown' },
];

const HEIGHT_BAND_OPTIONS = [
    { value: 'ALL', label: 'All heights' },
    { value: 'UNDER_5_6', label: "Under 5'6\"" },
    { value: '5_6_TO_5_10', label: "5'6\" – 5'10\"" },
    { value: '5_10_TO_6_2', label: "5'10\" – 6'2\"" },
    { value: 'OVER_6_2', label: "Over 6'2\"" },
    { value: 'UNKNOWN', label: 'Unknown' },
];

const SOURCE_OPTIONS = [
    { value: 'ALL', label: 'All sources' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'MOBILE_AGENT', label: 'Mobile agent' },
    { value: 'HARDWARE_DEVICE', label: 'Hardware device' },
    { value: 'AUTO_APPROVED', label: 'Auto-approved' },
    { value: 'BULK_IMPORT', label: 'Bulk import' },
];

export const AdvancedFiltersModal: React.FC = () => {
    const {
        showAdvancedFiltersModal,
        setShowAdvancedFiltersModal,
        filterBanType,
        setFilterBanType,
        filterNationality,
        setFilterNationality,
        filterRiskLevel,
        setFilterRiskLevel,
        filterExpiringSoon,
        setFilterExpiringSoon,
        filterHasPhoto,
        setFilterHasPhoto,
        filterGender,
        setFilterGender,
        filterDistinguishingFeatures,
        setFilterDistinguishingFeatures,
        filterSource,
        setFilterSource,
        filterBuild,
        setFilterBuild,
        filterHairColor,
        setFilterHairColor,
        filterHeightBand,
        setFilterHeightBand,
        bannedIndividuals,
    } = useBannedIndividualsContext();

    if (!showAdvancedFiltersModal) return null;

    const nationalities = Array.from(new Set(bannedIndividuals.map((i) => i.nationality).filter(Boolean))).sort() as string[];
    const hairColors = Array.from(
        new Set(bannedIndividuals.map((i) => i.hairColor).filter(Boolean) as string[])
    ).sort();

    const clearAllAdvanced = () => {
        setFilterBanType('ALL');
        setFilterNationality('ALL');
        setFilterRiskLevel('ALL');
        setFilterExpiringSoon(false);
        setFilterHasPhoto('ALL');
        setFilterGender('ALL');
        setFilterDistinguishingFeatures('');
        setFilterSource('ALL');
        setFilterBuild('ALL');
        setFilterHairColor('ALL');
        setFilterHeightBand('ALL');
    };

    const selectClass =
        'w-full px-4 py-2.5 border border-white/10 rounded-lg bg-slate-900/50 text-[color:var(--text-main)] text-[10px] font-bold uppercase tracking-wider focus:ring-2 focus:ring-blue-500/30 focus:outline-none cursor-pointer appearance-none';
    const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1.5';

    return (
        <Modal
            isOpen={showAdvancedFiltersModal}
            onClose={() => setShowAdvancedFiltersModal(false)}
            title="Advanced filters"
            size="md"
            footer={
                <>
                    <Button variant="subtle" onClick={() => setShowAdvancedFiltersModal(false)}>Cancel</Button>
                    <Button variant="outline" onClick={clearAllAdvanced}>Reset all</Button>
                    <Button variant="primary" onClick={() => setShowAdvancedFiltersModal(false)}>Apply</Button>
                </>
            }
        >
            <div className="space-y-6">
                    {/* Quick narrow */}
                    <section>
                        <h4 className={cn(labelClass, 'mb-3')}>Quick narrow</h4>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.03] hover:bg-white/5 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filterExpiringSoon}
                                    onChange={(e) => setFilterExpiringSoon(e.target.checked)}
                                    className="w-4 h-4 accent-blue-600 rounded border-white/10 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--text-main)]">
                                    Expiring in next 30 days only
                                </span>
                            </label>
                            <div>
                                <span className={labelClass}>Has reference photo</span>
                                <select
                                    value={filterHasPhoto}
                                    onChange={(e) => setFilterHasPhoto(e.target.value as 'ALL' | 'YES' | 'NO')}
                                    className={selectClass}
                                >
                                    <option value="ALL" className="bg-slate-900">All</option>
                                    <option value="YES" className="bg-slate-900">Yes only</option>
                                    <option value="NO" className="bg-slate-900">No only</option>
                                </select>
                            </div>
                            <div>
                                <span className={labelClass}>Source</span>
                                <select
                                    value={filterSource}
                                    onChange={(e) => setFilterSource(e.target.value)}
                                    className={selectClass}
                                >
                                    {SOURCE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value} className="bg-slate-900">
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Identity / physical traits */}
                    <section>
                        <h4 className={cn(labelClass, 'mb-3')}>Identity & physical traits</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Gender</label>
                                <select
                                    value={filterGender}
                                    onChange={(e) => setFilterGender(e.target.value)}
                                    className={selectClass}
                                >
                                    {GENDER_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value} className="bg-slate-900">
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Nationality</label>
                                <select
                                    value={filterNationality}
                                    onChange={(e) => setFilterNationality(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="ALL" className="bg-slate-900">All</option>
                                    {nationalities.map((nat) => (
                                        <option key={nat} value={nat} className="bg-slate-900">
                                            {nat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Build</label>
                                <select
                                    value={filterBuild}
                                    onChange={(e) => setFilterBuild(e.target.value)}
                                    className={selectClass}
                                >
                                    {BUILD_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value} className="bg-slate-900">
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Height band</label>
                                <select
                                    value={filterHeightBand}
                                    onChange={(e) => setFilterHeightBand(e.target.value)}
                                    className={selectClass}
                                >
                                    {HEIGHT_BAND_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value} className="bg-slate-900">
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {hairColors.length > 0 && (
                                <div className="sm:col-span-2">
                                    <label className={labelClass}>Hair color</label>
                                    <select
                                        value={filterHairColor}
                                        onChange={(e) => setFilterHairColor(e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="ALL" className="bg-slate-900">All</option>
                                        {hairColors.map((c) => (
                                            <option key={c} value={c} className="bg-slate-900">
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <label className={labelClass}>Distinguishing features / notes (search text)</label>
                            <input
                                type="text"
                                value={filterDistinguishingFeatures}
                                onChange={(e) => setFilterDistinguishingFeatures(e.target.value)}
                                placeholder="e.g. beard, scar, tattoo, glasses"
                                className="w-full px-4 py-2.5 border border-white/10 rounded-lg bg-slate-900/50 text-[color:var(--text-main)] placeholder:text-[color:var(--text-sub)]/50 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                            />
                        </div>
                    </section>

                    {/* Ban type & risk */}
                    <section>
                        <h4 className={cn(labelClass, 'mb-3')}>Ban & risk</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Ban type</label>
                                <select
                                    value={filterBanType}
                                    onChange={(e) => setFilterBanType(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="ALL" className="bg-slate-900">All</option>
                                    <option value="TEMPORARY" className="bg-slate-900">Temporary</option>
                                    <option value="PERMANENT" className="bg-slate-900">Permanent</option>
                                    <option value="CONDITIONAL" className="bg-slate-900">Conditional</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Risk level</label>
                                <select
                                    value={filterRiskLevel}
                                    onChange={(e) => setFilterRiskLevel(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="ALL" className="bg-slate-900">All</option>
                                    <option value="LOW" className="bg-slate-900">Low</option>
                                    <option value="MEDIUM" className="bg-slate-900">Medium</option>
                                    <option value="HIGH" className="bg-slate-900">High</option>
                                    <option value="CRITICAL" className="bg-slate-900">Critical</option>
                                </select>
                            </div>
                        </div>
                    </section>

            </div>
        </Modal>
    );
};
