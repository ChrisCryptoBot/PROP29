/**
 * Access Points Filter Component
 * Reusable filter/search UI for Access Points tab
 * Extracted for modularity per directive
 */

import React from 'react';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { Select } from '../../../../components/UI/Select';

export interface AccessPointsFilterProps {
  searchQuery: string;
  typeFilter: 'all' | 'door' | 'gate' | 'elevator' | 'turnstile' | 'barrier';
  statusFilter: 'all' | 'active' | 'maintenance' | 'disabled' | 'inactive';
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: 'all' | 'door' | 'gate' | 'elevator' | 'turnstile' | 'barrier') => void;
  onStatusFilterChange: (value: 'all' | 'active' | 'maintenance' | 'disabled' | 'inactive') => void;
  onClearAll: () => void;
}

export const AccessPointsFilter: React.FC<AccessPointsFilterProps> = React.memo(({
  searchQuery,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onClearAll,
}) => {
  const hasActiveFilters = searchQuery || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6" role="search" aria-label="Filter access points">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="access-point-search" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-2 uppercase tracking-widest ml-1">
            Search Access Points
          </label>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="SEARCH NAMES, LOCATIONS..."
            className="bg-[color:var(--console-dark)] border-white/5 text-[color:var(--text-main)] placeholder:opacity-20"
            aria-label="Search access points by name, location, type, or access method"
          />
        </div>
        <Select
          id="access-point-type-filter"
          label="Access Point Type"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as typeof typeFilter)}
          aria-label="Filter by access point type"
        >
          <option value="all">ALL TYPES</option>
          <option value="door">DOORS</option>
          <option value="gate">GATES</option>
          <option value="elevator">ELEVATORS</option>
          <option value="turnstile">TURNSTILES</option>
          <option value="barrier">BARRIERS</option>
        </Select>
        <Select
          id="access-point-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as typeof statusFilter)}
          aria-label="Filter by access point status"
        >
          <option value="all">ALL STATUSES</option>
          <option value="active">ACTIVE</option>
          <option value="maintenance">MAINTENANCE</option>
          <option value="disabled">DISABLED</option>
          <option value="inactive">INACTIVE</option>
        </Select>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-white/5" role="list" aria-label="Active filters">
          <span className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50">Active Filters:</span>
          {searchQuery && (
            <Badge
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-white/5 transition-colors text-[9px] font-black uppercase tracking-widest border-blue-500/20 text-blue-400"
              onClick={() => onSearchChange('')}
              role="listitem"
              aria-label={`Remove search filter: ${searchQuery}`}
            >
              SEARCH: {searchQuery.toUpperCase()}
              <i className="fas fa-times ml-2 opacity-50" aria-hidden="true" />
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-white/5 transition-colors text-[9px] font-black uppercase tracking-widest border-blue-500/20 text-blue-400"
              onClick={() => onTypeFilterChange('all')}
              role="listitem"
              aria-label={`Remove type filter: ${typeFilter}`}
            >
              TYPE: {typeFilter.toUpperCase()}
              <i className="fas fa-times ml-2 opacity-50" aria-hidden="true" />
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-white/5 transition-colors text-[9px] font-black uppercase tracking-widest border-blue-500/20 text-blue-400"
              onClick={() => onStatusFilterChange('all')}
              role="listitem"
              aria-label={`Remove status filter: ${statusFilter}`}
            >
              STATUS: {statusFilter.toUpperCase()}
              <i className="fas fa-times ml-2 opacity-50" aria-hidden="true" />
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-[9px] font-black uppercase tracking-widest border-red-500/20 text-red-500 hover:bg-red-500/10 h-7"
            onClick={onClearAll}
            aria-label="Clear all filters"
          >
            PURGE FILTERS
          </Button>
        </div>
      )}
    </div>
  );
});

AccessPointsFilter.displayName = 'AccessPointsFilter';

