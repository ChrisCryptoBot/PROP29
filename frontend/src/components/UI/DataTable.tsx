import React, { useState, useMemo } from 'react';
import { SearchBar } from './SearchBar';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  searchable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: any) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  actions?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  loading = false,
  pagination = true,
  pageSize = 10,
  searchable = true,
  filterable = true,
  selectable = false,
  onRowClick,
  onSelectionChange,
  actions,
  emptyMessage = "No data available",
  className = ""
}) => {
  // Always treat data as an array
  const safeData = Array.isArray(data) ? data : [];
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filter data based on search term and filters
  const filteredData = useMemo(() => {
    let filtered = safeData;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    return filtered;
  }, [safeData, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle row selection
  const handleRowSelect = (row: any) => {
    const isSelected = selectedRows.some(selectedRow => selectedRow.id === row.id);
    let newSelectedRows;

    if (isSelected) {
      newSelectedRows = selectedRows.filter(selectedRow => selectedRow.id !== row.id);
    } else {
      newSelectedRows = [...selectedRows, row];
    }

    setSelectedRows(newSelectedRows);
    onSelectionChange?.(newSelectedRows);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
      onSelectionChange?.([]);
    } else {
      setSelectedRows(paginatedData);
      onSelectionChange?.(paginatedData);
    }
  };

  // Handle filter change
  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className={`bg-slate-900/50 rounded-lg border border-white/5 ${className}`} role="status" aria-label="Loading table">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/4 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-white/10 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-lg border border-white/5 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {safeData.length} {safeData.length === 1 ? 'record' : 'records'}
          </h3>
          {actions && <div>{actions}</div>}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {searchable && (
            <SearchBar
              className="flex-1"
              placeholder="Search..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          )}

          {filterable && (
            <div className="flex gap-2">
              {columns
                .filter(col => col.filterable)
                .map(column => (
                  <div key={column.key} className="relative">
                    <i className="fas fa-filter absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden />
                    <input
                      type="text"
                      placeholder={
                        column.label === 'Handover From' ? 'From' :
                        column.label === 'Handover To' ? 'To' :
                        column.label === 'Shift Information' ? 'Shift' :
                        column.label === 'Checklist Progress' ? 'Checklist' :
                        column.label
                      }
                      value={filters[column.key] || ''}
                      onChange={e => handleFilterChange(column.key, e.target.value)}
                      className="pl-8 pr-2 py-1 min-w-[80px] max-w-[110px] mr-0.5 text-sm bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 focus:outline-none"
                      aria-label={`Filter by ${column.label}`}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-white/5 text-blue-600 focus:ring-blue-500/60 bg-white/5"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] ${
                    column.sortable ? 'cursor-pointer hover:bg-white/10' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                  aria-sort={column.sortable && sortColumn === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'asc' ? <i className="fas fa-chevron-up w-4 h-4" aria-hidden /> : <i className="fas fa-chevron-down w-4 h-4" aria-hidden />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.some(selectedRow => selectedRow.id === row.id)}
                        onChange={() => handleRowSelect(row)}
                        className="rounded border-white/5 text-blue-600 focus:ring-blue-500/60 bg-white/5"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={column.key} className="px-4 py-3 text-sm text-white">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-white/5 bg-white/5" aria-label="Table pagination">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300" aria-live="polite">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-white/5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 text-slate-300 hover:text-white focus:ring-2 focus:ring-blue-500/60 focus:outline-none"
                aria-label="Previous page"
              >
                <i className="fas fa-chevron-left w-4 h-4" aria-hidden />
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                const isCurrentPage = page === currentPage;
                const isNearCurrent = Math.abs(page - currentPage) <= 2;
                
                if (isCurrentPage || isNearCurrent || page === 1 || page === totalPages) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded-md focus:ring-2 focus:ring-blue-500/60 focus:outline-none ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      aria-label={isCurrentPage ? `Page ${page}, current page` : `Go to page ${page}`}
                      aria-current={isCurrentPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                } else if (page === 2 && currentPage > 4) {
                  return <span key={page} className="px-2 text-[color:var(--text-sub)]">...</span>;
                } else if (page === totalPages - 1 && currentPage < totalPages - 3) {
                  return <span key={page} className="px-2 text-[color:var(--text-sub)]">...</span>;
                }
                return null;
              })}
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-white/5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 text-slate-300 hover:text-white focus:ring-2 focus:ring-blue-500/60 focus:outline-none"
                aria-label="Next page"
              >
                <i className="fas fa-chevron-right w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable; 
