import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface StockListItem {
  id: string;
  name?: string;
  period?: string;
}

interface UseStockListResult {
  stocks: StockListItem[];
  loading: boolean;
  error: string | null;
}

export const useStockList = (): UseStockListResult => {
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getDocs(collection(db, 'stocks'));
        const stockList: StockListItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: typeof data.name === 'string' ? data.name : undefined,
            period: typeof data.period === 'string' ? data.period : undefined,
          };
        });
        setStocks(stockList);
      } catch (err) {
        console.error('Failed to load stock list:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stocks.');
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  return { stocks, loading, error };
};
