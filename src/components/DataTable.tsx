import React, { useState, useMemo } from 'react';
import { SheetRow } from '../types';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Lock, Unlock, Phone, Calendar, User, Tag, Loader2 } from 'lucide-react';

interface DataTableProps {
  data: SheetRow[];
  onStatusChange: (row: SheetRow, newStatus: 'Open' | 'Reserved') => void;
  pendingUpdates: Map<string, boolean>;
  loading?: boolean;
}

export function DataTable({ data, onStatusChange, pendingUpdates, loading = false }: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof SheetRow | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const columnOrder: (keyof SheetRow)[] = [
    'msisdn',
    'assignDate',
    'category',
    'statusByCallCenter',
    'statusByBackOffice',
    'date',
    'owner'
  ];

  const formatMsisdn = (msisdn: string | number): string => {
    const msisdnStr = String(msisdn);
    if (msisdnStr.startsWith('971')) {
      return '0' + msisdnStr.slice(3);
    }
    return msisdnStr;
  };

  const handleSort = (field: keyof SheetRow) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = (row: SheetRow, newStatus: 'Open' | 'Reserved') => {
    if (newStatus === 'Reserved') {
      const confirmed = window.confirm(`Are you sure you want to change the status to Reserved?`);
      if (!confirmed) return;
    }
    onStatusChange(row, newStatus);
  };

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const searchTerms = search.toLowerCase().trim().split(/\s+/);
    
    return data.filter((row) => {
      return searchTerms.every(term => {
        if (searchTerms.length >= 2 && searchTerms[searchTerms.length - 1] === 'end') {
          const searchNumber = searchTerms.slice(0, -1).join('');
          if (/^\d+$/.test(searchNumber)) {
            const formattedMsisdn = formatMsisdn(row.msisdn);
            return formattedMsisdn.endsWith(searchNumber);
          }
        }

        if (term.includes(':')) {
          const [categorySearch, numberSearch] = term.split(':').map(s => s.trim());
          if (!categorySearch || !numberSearch) return false;
          
          const categoryMatch = row.category.toLowerCase().includes(categorySearch);
          const numberMatch = String(row.msisdn).includes(numberSearch);
          return categoryMatch && numberMatch;
        }

        if (/^\d+$/.test(term)) {
          const msisdnStr = String(row.msisdn);
          if (msisdnStr.includes(term)) return true;
        }

        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(term)
        );
      });
    });
  }, [data, search]);

  const displayData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = String(a[sortField]);
      const bValue = String(b[sortField]);
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [filteredData, sortField, sortDirection]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(displayData.length / pageSize);
  const paginatedData = pageSize === -1 
    ? displayData 
    : displayData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) {
    return (
      <div className="w-full space-y-6">
        {/* Search bar skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex-grow max-w-2xl">
            <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-white/5 rounded-xl animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {columnOrder.map((key) => (
                    <th key={key} className={`px-6 py-4 text-left ${
                      key === 'msisdn' ? 'sticky left-0 z-30 bg-[#1a2236]' : ''
                    }`}>
                      <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[...Array(5)].map((_, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-[#141b2d]' : 'bg-[#1a2236]'}>
                    {columnOrder.map((key, colIndex) => (
                      <td key={`${rowIndex}-${key}`} 
                        className={`px-6 py-4 ${
                          key === 'msisdn' 
                            ? `sticky left-0 z-20 ${rowIndex % 2 === 0 ? 'bg-[#141b2d]' : 'bg-[#1a2236]'}`
                            : ''
                        }`}
                      >
                        <div className={`h-4 bg-white/10 rounded animate-pulse ${
                          key === 'statusByCallCenter' ? 'w-32' : 'w-24'
                        }`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="h-4 bg-white/10 rounded w-48 animate-pulse" />
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex-grow max-w-2xl">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors duration-200" size={20} />
            <input
              type="text"
              placeholder="Search In Any Way"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-white 
                placeholder-white/40 text-base transition-all duration-200"
            />
            {search && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 text-sm">
                {filteredData.length} results
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-white/60 text-sm">Show:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm
              focus:ring-2 focus:ring-primary/50 focus:border-primary/50 hover:bg-white/10 
              transition-all duration-200"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="-1">All</option>
          </select>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm relative">
            <thead>
              <tr className="border-b border-white/10">
                {columnOrder.map((key) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`group px-6 py-4 text-left text-xs font-medium uppercase tracking-wider 
                      text-white/60 cursor-pointer hover:text-white transition-colors duration-200
                      ${key === 'msisdn' ? 'sticky left-0 z-30 bg-[#1a2236] shadow-[2px_0_4px_rgba(0,0,0,0.3)]' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {key === 'msisdn' && <Phone size={14} />}
                      {key === 'assignDate' && <Calendar size={14} />}
                      {key === 'category' && <Tag size={14} />}
                      {key === 'owner' && <User size={14} />}
                      <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <ArrowUpDown size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        sortField === key ? 'opacity-100 text-primary' : ''
                      }`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedData.map((row, index) => {
                const isUpdating = pendingUpdates.get(row.msisdn);
                const isEven = index % 2 === 0;
                const baseBg = isEven ? '[#141b2d]' : '[#1a2236]';

                return (
                  <tr key={row.msisdn} 
                    className={`group hover:bg-white/5 transition-colors duration-200`}
                  >
                    {columnOrder.map((key) => {
                      const value = row[key];
                      const isMsisdn = key === 'msisdn';

                      return (
                        <td 
                          key={key} 
                          className={`px-6 py-4 whitespace-nowrap text-l font-bold
                            ${isMsisdn ? `
                              sticky left-0 z-20
                              shadow-[2px_0_4px_rgba(0,0,0,0.3)]
                              bg-${baseBg}
                              group-hover:bg-white/5
                            ` : ''}`}
                        >
                          {key === 'statusByCallCenter' ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={value}
                                onChange={(e) => handleStatusChange(row, e.target.value as 'Open' | 'Reserved')}
                                disabled={isUpdating}
                                className={`w-32 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                  focus:ring-2 focus:ring-white/30 ${
                                  value === 'Open' 
                                    ? 'bg-green-400/10 text-green-400 border-green-400/30' 
                                    : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                                  } ${isUpdating ? 'opacity-50' : ''}`}
                              >
                                <option value="Open">Open</option>
                                <option value="Reserved">Reserved</option>
                              </select>
                              {isUpdating ? (
                                <Loader2 size={16} className="text-white/60 animate-spin" />
                              ) : value === 'Open' ? (
                                <Unlock size={16} className="text-green-400" />
                              ) : (
                                <Lock size={16} className="text-yellow-400" />
                              )}
                            </div>
                          ) : isMsisdn ? (
                            <span className="font-medium text-white">{formatMsisdn(String(value))}</span>
                          ) : (
                            <span className="text-white/80">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pageSize !== -1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/60">
          <div>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, displayData.length)} of {displayData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent
                transition-all duration-200"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span>...</span>}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent
                transition-all duration-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}