import React, { useState, useEffect } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Stats } from './Stats';
import { DataTable } from './DataTable';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  isDataLoaded: boolean;
}

export function LoadingScreen({ onLoadingComplete, isDataLoaded }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initialInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 70) {
          clearInterval(initialInterval);
          return 70;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(initialInterval);
  }, []);

  useEffect(() => {
    if (progress >= 70 && isDataLoaded) {
      const finalInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(finalInterval);
            setTimeout(onLoadingComplete, 200);
            return 100;
          }
          return prev + 5;
        });
      }, 50);

      return () => clearInterval(finalInterval);
    }
  }, [progress, isDataLoaded, onLoadingComplete]);

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 glass rounded-xl">
                <FileSpreadsheet size={32} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                  Google Sheets Manager
                </h1>
                <div className="loader-ring-small mt-2">
                  <div className="loader-progress-small">{progress}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <Stats data={[]} onCategoryClick={() => {}} selectedCategory={null} loading={true} />

        {/* Table Skeleton */}
        <div className="card">
          <DataTable 
            data={[]} 
            onStatusChange={() => {}} 
            pendingUpdates={new Map()} 
            loading={true}
          />
        </div>
      </div>
    </div>
  );
}