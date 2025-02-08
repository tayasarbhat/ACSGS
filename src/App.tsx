import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { SheetRow } from './types';
import { fetchSheetData, updateStatus } from './api';
import { DataTable } from './components/DataTable';
import { Stats } from './components/Stats';
import { Toast } from './components/Toast';
import { LoadingScreen } from './components/LoadingScreen';
import { Login } from './components/Login';
import { FileSpreadsheet, RefreshCw } from 'lucide-react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const FETCH_INTERVAL = 2000;
const IDLE_FETCH_INTERVAL = 5000;
const UPDATE_DELAY = 800;

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  // Data and UI state
  const [data, setData] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now());
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, boolean>>(new Map());
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      setShowLoadingScreen(true);
    }
  }, []);

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setRefreshing(true);
      }
      setError(null);
      const sheetData = await fetchSheetData();
      
      const hasDataChanged = JSON.stringify(sheetData) !== JSON.stringify(data);
      if (hasDataChanged) {
        const newPendingUpdates = new Map();
        pendingUpdates.forEach((value, key) => {
          const stillExists = sheetData.some(row => row.msisdn === key);
          if (stillExists) {
            newPendingUpdates.set(key, value);
          }
        });
        setPendingUpdates(newPendingUpdates);
        setData(sheetData);
      }
      setLastFetchTime(Date.now());
      setInitialDataLoaded(true);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      if (showLoading) {
        setRefreshing(false);
      }
      setLoading(false);
    }
  }, [data, pendingUpdates]);

  const handleLogin = (password: string) => {
    if (password === 'tayasar') {
      sessionStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      setShowLoadingScreen(true);
      loadData(true);
    } else {
      setToast({
        message: 'Incorrect password',
        type: 'error'
      });
    }
  };

  const handleRefresh = useCallback(() => loadData(true), [loadData]);

  const handleStatusChange = useCallback(async (row: SheetRow, newStatus: 'Open' | 'Reserved') => {
    const updateKey = row.msisdn;

    if (pendingUpdates.get(updateKey)) {
      return;
    }

    try {
      setToast({
        message: `Number ${row.msisdn} is being ${newStatus.toLowerCase()}...`,
        type: 'success'
      });

      setPendingUpdates(prev => new Map(prev).set(updateKey, true));

      setData(prevData => 
        prevData.map(item => 
          item.msisdn === row.msisdn 
            ? { ...item, statusByCallCenter: newStatus }
            : item
        )
      );

      await updateStatus(row.msisdn, newStatus);
      await new Promise(resolve => setTimeout(resolve, UPDATE_DELAY));
      
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateKey);
        return newMap;
      });

      setToast({
        message: `Number ${row.msisdn} has been ${newStatus.toLowerCase()}`,
        type: 'success'
      });

      await loadData();
    } catch (err) {
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(updateKey);
        return newMap;
      });

      setData(prevData => 
        prevData.map(item => 
          item.msisdn === row.msisdn 
            ? { ...item, statusByCallCenter: row.statusByCallCenter }
            : item
        )
      );

      setToast({
        message: 'Failed to update status',
        type: 'error'
      });
      
      await loadData();
    }
  }, [loadData]);

  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
  }, []);

  const filteredData = useMemo(() => {
    if (!selectedCategory) return data;
    return data.filter(row => row.category === selectedCategory);
  }, [data, selectedCategory]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let fetchInterval: number | undefined;
    let idleInterval: number | undefined;
    let immediateUpdateTimeout: number | undefined;

    const startFetching = (interval: number) => {
      stopFetching();
      return window.setInterval(() => {
        if (Date.now() - lastFetchTime >= interval) {
          loadData();
        }
      }, interval);
    };

    const stopFetching = () => {
      if (fetchInterval) window.clearInterval(fetchInterval);
      if (idleInterval) window.clearInterval(idleInterval);
      if (immediateUpdateTimeout) window.clearTimeout(immediateUpdateTimeout);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        idleInterval = startFetching(IDLE_FETCH_INTERVAL);
      } else {
        fetchInterval = startFetching(FETCH_INTERVAL);
        loadData();
      }
    };

    fetchInterval = startFetching(FETCH_INTERVAL);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let idleTimeout: number;
    const handleUserActivity = () => {
      window.clearTimeout(idleTimeout);
      
      if (idleInterval) {
        window.clearInterval(idleInterval);
        idleInterval = undefined;
      }
      
      if (immediateUpdateTimeout) {
        window.clearTimeout(immediateUpdateTimeout);
      }
      immediateUpdateTimeout = window.setTimeout(() => {
        loadData();
      }, 100);
      
      fetchInterval = startFetching(FETCH_INTERVAL);
      
      idleTimeout = window.setTimeout(() => {
        idleInterval = startFetching(IDLE_FETCH_INTERVAL);
      }, 60000);
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      stopFetching();
      window.clearTimeout(idleTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [loadData, lastFetchTime, isAuthenticated]);

  // Clear session storage on mount to force login
  useEffect(() => {
    sessionStorage.removeItem('isAuthenticated');
  }, []);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // Show loading screen after authentication
  if (showLoadingScreen) {
    return (
      <LoadingScreen 
        onLoadingComplete={() => setShowLoadingScreen(false)} 
        isDataLoaded={initialDataLoaded}
      />
    );
  }

  // Main app content
  return (
    <div className="min-h-screen p-4 sm:p-6 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="card mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 glass rounded-xl">
                <FileSpreadsheet size={32} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                  Google Sheets Manager
                </h1>
                {selectedCategory && (
                  <p className="text-sm text-white/60 mt-1">
                    Filtering by: {selectedCategory}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-ghost"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              <span className="ml-2">Refresh</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="card bg-red-500/10 border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <Stats 
          data={data} 
          onCategoryClick={handleCategoryClick} 
          selectedCategory={selectedCategory}
          loading={loading}
        />

        <Suspense fallback={null}>
          <div className="card">
            <DataTable 
              data={filteredData} 
              onStatusChange={handleStatusChange}
              pendingUpdates={pendingUpdates}
              loading={loading}
            />
          </div>
        </Suspense>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
