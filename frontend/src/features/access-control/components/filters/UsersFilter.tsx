/**
 * Users Filter Component
 * Reusable filter/search UI for Users tab
 * Extracted for modularity per directive
 */

import React from 'react';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { Select } from '../../../../components/UI/Select';

export interface UsersFilterProps {
  searchQuery: string;
  roleFilter: 'all' | 'admin' | 'manager' | 'employee' | 'guest' | 'security' | 'executive' | 'it' | 'contractor';
  statusFilter: 'all' | 'active' | 'inactive' | 'suspended';
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: 'all' | 'admin' | 'manager' | 'employee' | 'guest' | 'security' | 'executive' | 'it' | 'contractor') => void;
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive' | 'suspended') => void;
  onClearAll: () => void;
}

export const UsersFilter: React.FC<UsersFilterProps> = React.memo(({
  searchQuery,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onClearAll,
}) => {
  const hasActiveFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6" role="search" aria-label="Filter users">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="user-search" className="block text-[10px] font-black text-[color:var(--text-sub)] mb-2 uppercase tracking-widest ml-1">
            Search Users
          </label>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="SEARCH NAMES, EMAILS, DEPARTMENTS..."
            className="bg-[color:var(--console-dark)] border-white/5 text-[color:var(--text-main)] placeholder:opacity-20"
            aria-label="Search users by name, email, department, or employee ID"
          />
        </div>
        <Select
          id="user-role-filter"
          label="Role"
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value as typeof roleFilter)}
          aria-label="Filter by user role"
        >
          <option value="all">ALL ROLES</option>
          <option value="admin">ADMIN</option>
          <option value="manager">MANAGER</option>
          <option value="employee">EMPLOYEE</option>
          <option value="guest">GUEST</option>
          <option value="security">SECURITY</option>
          <option value="executive">EXECUTIVE</option>
          <option value="it">IT</option>
          <option value="contractor">CONTRACTOR</option>
        </Select>
        <Select
          id="user-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as typeof statusFilter)}
          aria-label="Filter by user status"
        >
          <option value="all">ALL STATUSES</option>
          <option value="active">ACTIVE</option>
          <option value="inactive">INACTIVE</option>
          <option value="suspended">SUSPENDED</option>
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
          {roleFilter !== 'all' && (
            <Badge
              variant="outline"
              size="sm"
              className="cursor-pointer hover:bg-white/5 transition-colors text-[9px] font-black uppercase tracking-widest border-blue-500/20 text-blue-400"
              onClick={() => onRoleFilterChange('all')}
              role="listitem"
              aria-label={`Remove role filter: ${roleFilter}`}
            >
              ROLE: {roleFilter.toUpperCase()}
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
            FLUSH FILTERS
          </Button>
        </div>
      )}
    </div>
  );
});

UsersFilter.displayName = 'UsersFilter';

