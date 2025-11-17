import type { BusinessDay, Time } from 'lightweight-charts';

export const normalizeDateString = (value: string | undefined | null): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.includes('T') ? trimmed.split('T')[0] : trimmed;
};

export const toBusinessDay = (dateString: string): BusinessDay | null => {
  const normalized = normalizeDateString(dateString);
  if (!normalized) return null;
  const [yearStr, monthStr, dayStr] = normalized.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if ([year, month, day].some(value => Number.isNaN(value))) {
    return null;
  }
  return { year, month: month as BusinessDay['month'], day: day as BusinessDay['day'] };
};

export const toTimestamp = (dateString: string): number | null => {
  const normalized = normalizeDateString(dateString);
  if (!normalized) return null;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const toChartTime = (dateString: string): Time | null => {
  const businessDay = toBusinessDay(dateString);
  if (businessDay) return businessDay;
  const timestamp = toTimestamp(dateString);
  return timestamp !== null ? (timestamp / 1000) as Time : null;
};

export const formatDateLabel = (time: Time | string | number | undefined): string => {
  if (!time) return '';
  if (typeof time === 'string') {
    return normalizeDateString(time);
  }
  if (typeof time === 'number') {
    return new Date(time * 1000).toISOString().split('T')[0];
  }
  return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
};
