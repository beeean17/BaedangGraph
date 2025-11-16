import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { StockData, DividendData } from '../types';

// Helper function to get the last N months as "YYYY-MM" strings
const getLastNMonths = (n: number) => {
  const months = [];
  let date = new Date();
  for (let i = 0; i < n; i++) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    months.push(`${year}-${month}`);
    date.setMonth(date.getMonth() - 1);
  }
  return months;
};

export const useStockData = (symbol: string) => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [dividends, setDividends] = useState<DividendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // --- Fetch Dividends ---
        const dividendPromise = async () => {
          const stockDocRef = doc(db, 'stocks', symbol);
          const stockDocSnap = await getDoc(stockDocRef);
          const fetchedDividends: DividendData[] = [];

          if (stockDocSnap.exists()) {
            const data = stockDocSnap.data();
            if (data.dividends) {
              Object.keys(data.dividends).forEach(year => {
                Object.keys(data.dividends[year]).forEach(date => {
                  fetchedDividends.push({
                    date: `${year}-${date}`,
                    amount: data.dividends[year][date],
                  });
                });
              });
            }
          }
          return fetchedDividends;
        };

        // --- Fetch Stock Prices (Candlestick Data) ---
        const stockPricePromise = async () => {
          const monthlyIds = getLastNMonths(12); // Fetch last 12 months
          const monthlyPromises = monthlyIds.map(id => getDoc(doc(db, 'stocks', symbol, 'monthly', id)));
          const monthlyDocs = await Promise.all(monthlyPromises);
          
          const allDaysData: StockData[] = [];
          const toInteger = (value: unknown) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? Math.trunc(num) : 0;
          };

          monthlyDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              const monthData = docSnap.data();
              const monthStr = docSnap.id; // "YYYY-MM"
              if (monthData.days) {
                Object.keys(monthData.days).forEach(day => {
                  const dayData = monthData.days[day];
                  const normalizedDayData: StockData = {
                    time: `${monthStr}-${day.padStart(2, '0')}`,
                    open: toInteger(dayData.open),
                    high: toInteger(dayData.high),
                    low: toInteger(dayData.low),
                    close: toInteger(dayData.close),
                    volume: dayData.volume !== undefined ? toInteger(dayData.volume) : undefined,
                  };
                  allDaysData.push(normalizedDayData);
                });
              }
            }
          });
          return allDaysData;
        };

        const [fetchedDividends, fetchedStockData] = await Promise.all([
          dividendPromise(),
          stockPricePromise(),
        ]);

        // Sort data by date
        fetchedDividends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        fetchedStockData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setDividends(fetchedDividends);
        setStockData(fetchedStockData);

      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data from Firebase.");
        setStockData([]);
        setDividends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  return { stockData, dividends, loading, error };
};
