import { useState, useEffect, useCallback } from 'react';
import { getStoredToken } from '../services/api';

const waitForToken = async () => {
  let attempts = 0;
  while (!getStoredToken() && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }
  return getStoredToken();
};

export function useAsyncData<T>(asyncFn: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Wait for token before making request
      await waitForToken();
      
      const result = await asyncFn();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error in useAsyncData:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData
  };
} 