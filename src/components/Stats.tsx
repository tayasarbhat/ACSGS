import React from 'react';
import { SheetRow } from '../types';
import { Lock, Unlock, ChevronRight } from 'lucide-react';

interface StatsProps {
  data: SheetRow[];
  onCategoryClick: (category: string) => void;
  selectedCategory: string | null;
  loading?: boolean;
}

export function Stats({ data, onCategoryClick, selectedCategory, loading = false }: StatsProps) {
  const stats = React.useMemo(() => {
    const categoryStats = data.reduce((acc, row) => {
      const category = row.category;
      const status = row.statusByCallCenter;
      
      if (!acc[category]) {
        acc[category] = { total: 0, open: 0, reserved: 0 };
      }
      
      acc[category].total++;
      acc[category][status.toLowerCase()]++;
      
      return acc;
    }, {} as Record<string, { total: number; open: number; reserved: number }>);

    return { categories: categoryStats };
  }, [data]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
            <div className="relative p-6 flex flex-col h-full">
              {/* Title skeleton */}
              <div className="h-7 bg-white/10 rounded-lg w-2/3 mb-4" />
              
              {/* Stats skeleton */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-white/10 rounded w-24" />
                  <div className="h-8 bg-white/10 rounded w-12" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/10 rounded-full h-2" />
                    <div className="h-4 bg-white/10 rounded w-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/10 rounded-full h-2" />
                    <div className="h-4 bg-white/10 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(stats.categories).map(([category, { total, open, reserved }]) => (
        <button
          key={category}
          onClick={() => onCategoryClick(category)}
          className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
            selectedCategory === category 
              ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
              : 'hover:scale-[1.02]'
          }`}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
          
          {/* Hover effect */}
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Content */}
          <div className="relative p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white truncate">{category}</h3>
              <ChevronRight 
                className={`text-white/60 transition-transform duration-300 ${
                  selectedCategory === category ? 'rotate-90' : 'group-hover:translate-x-1'
                }`} 
                size={20} 
              />
            </div>
            
            {/* Stats */}
            <div className="flex flex-col gap-3">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-white/60">Total Numbers</span>
                <span className="text-2xl font-bold text-white">{total}</span>
              </div>
              
              {/* Status bars */}
              <div className="space-y-2">
                {/* Open numbers */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-green-400 transition-all duration-500"
                      style={{ width: `${(open / total) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-[80px]">
                    <Unlock size={14} className="text-green-400" />
                    <span className="text-sm font-medium text-green-400">{open}</span>
                  </div>
                </div>
                
                {/* Reserved numbers */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-500"
                      style={{ width: `${(reserved / total) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-[80px]">
                    <Lock size={14} className="text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">{reserved}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}