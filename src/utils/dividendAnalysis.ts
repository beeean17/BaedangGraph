import type { DividendData, DividendRangeStat, StockData } from '../types';

const compareDateStrings = (a: string, b: string) => a.localeCompare(b);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDate = (value: string) => new Date(value);

const diffInDays = (from: string, to: string) => {
  const fromDate = toDate(from).getTime();
  const toDateValue = toDate(to).getTime();
  if (Number.isNaN(fromDate) || Number.isNaN(toDateValue)) {
    return 0;
  }
  return Math.round((toDateValue - fromDate) / MS_PER_DAY);
};

export const buildDividendRangeStats = (
  stockData: StockData[],
  dividends: DividendData[],
): DividendRangeStat[] => {
  if (stockData.length === 0 || dividends.length < 2) {
    return [];
  }

  const normalizedDividends = dividends.map(dividend => ({
    ...dividend,
    date: dividend.date.split('T')[0],
  }));

  const sortedDividends = normalizedDividends.sort((a, b) => compareDateStrings(a.date, b.date));
  const uniqueDividends = sortedDividends.reduce<DividendData[]>((acc, current) => {
    const last = acc[acc.length - 1];
    if (last && last.date === current.date) {
      last.amount += current.amount;
      return acc;
    }
    acc.push({ ...current });
    return acc;
  }, []);

  if (uniqueDividends.length < 2) {
    return [];
  }

  const sortedStock = [...stockData].sort((a, b) => compareDateStrings(a.time, b.time));

  const stats: DividendRangeStat[] = [];

  for (let i = 0; i < uniqueDividends.length - 1; i++) {
    const startDividend = uniqueDividends[i];
    const endDividend = uniqueDividends[i + 1];
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
          daysFromStart: diffInDays(startDividend.date, point.time),
          daysToEnd: diffInDays(point.time, endDividend.date),
        };
      }
      if (!lowEntry || point.low < lowEntry.value) {
        lowEntry = {
          value: point.low,
          date: point.time,
          daysFromStart: diffInDays(startDividend.date, point.time),
          daysToEnd: diffInDays(point.time, endDividend.date),
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
