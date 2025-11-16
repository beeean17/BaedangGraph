import type { DividendData, DividendRangeStat, StockData } from '../types';

const compareDateStrings = (a: string, b: string) => a.localeCompare(b);

export const buildDividendRangeStats = (
  stockData: StockData[],
  dividends: DividendData[],
): DividendRangeStat[] => {
  if (stockData.length === 0 || dividends.length < 2) {
    return [];
  }

  const sortedDividends = [...dividends].sort((a, b) => compareDateStrings(a.date, b.date));
  const sortedStock = [...stockData].sort((a, b) => compareDateStrings(a.time, b.time));

  const stats: DividendRangeStat[] = [];

  for (let i = 0; i < sortedDividends.length - 1; i++) {
    const startDividend = sortedDividends[i];
    const endDividend = sortedDividends[i + 1];
    const rangeId = `${startDividend.date}-${endDividend.date}`;

    const rangeData = sortedStock.filter(point => {
      return point.time >= startDividend.date && point.time < endDividend.date;
    });

    let highEntry: DividendRangeStat['high'] = undefined;
    let lowEntry: DividendRangeStat['low'] = undefined;

    rangeData.forEach(point => {
      if (!highEntry || point.high > highEntry.value) {
        highEntry = {
          value: point.high,
          date: point.time,
        };
      }
      if (!lowEntry || point.low < lowEntry.value) {
        lowEntry = {
          value: point.low,
          date: point.time,
        };
      }
    });

    stats.push({
      id: rangeId,
      startDate: startDividend.date,
      endDate: endDividend.date,
      startDividendAmount: startDividend.amount,
      endDividendAmount: endDividend.amount,
      high: highEntry,
      low: lowEntry,
    });
  }

  return stats;
};
