import type { StockData, DividendData } from '../types';

// Generate sample stock data for demonstration
export const generateSampleStockData = (days: number = 100): StockData[] => {
  const data: StockData[] = [];
  const now = new Date();
  let basePrice = 150;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate price movements
    const change = (Math.random() - 0.5) * 5;
    basePrice += change;
    
    const open = basePrice + (Math.random() - 0.5) * 2;
    const close = basePrice + (Math.random() - 0.5) * 2;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;

    data.push({
      time: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000,
    });
  }

  return data;
};

// Generate sample dividend data
export const generateSampleDividends = (): DividendData[] => {
  const now = new Date();
  const dividends: DividendData[] = [];

  // Generate quarterly dividends for the past year
  for (let i = 0; i < 4; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (i * 3));
    
    dividends.push({
      date: date.toISOString().split('T')[0],
      amount: Number((0.5 + Math.random() * 0.3).toFixed(2)),
      currency: '$',
    });
  }

  return dividends.reverse();
};
