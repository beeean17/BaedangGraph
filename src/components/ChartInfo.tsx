import React from 'react';
import type { StockData, DividendData } from '../types';
import './ChartInfo.css';

type ChartInfoTime = string | { day: number; month: number; year: number };
// We might get a partial data point or a full one from the chart
type ChartInfoData = Omit<Partial<StockData>, 'time'> & { time?: ChartInfoTime };

interface ChartInfoProps {
  data: ChartInfoData | null;
  dividend?: DividendData | null;
}

const formatPrice = (price: number | undefined) => {
  if (price === undefined || price === null) {
    return '-';
  }
  return Math.trunc(price).toString();
};

const formatDate = (time: ChartInfoTime | undefined) => {
  if (!time) return '-';
  if (typeof time === 'string') {
    return new Date(time).toLocaleDateString();
  }
  // Handle the object format from lightweight-charts
  return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
};

const formatDividend = (dividend?: DividendData | null) => {
  if (!dividend) return null;
  const amount = Math.trunc(dividend.amount).toLocaleString();
  const date = new Date(dividend.date).toLocaleDateString();
  return { amount, date };
};

export const ChartInfo: React.FC<ChartInfoProps> = ({ data, dividend }) => {
  const formattedDividend = formatDividend(dividend);
  return (
    <div className="chart-info">
      {data ? (
        <>
          <div className="info-item date">
            <span className="value">{formatDate(data.time)}</span>
          </div>
          <div className="info-item">
            <span className="label">O:</span>
            <span className="value">{formatPrice(data.open)}</span>
          </div>
          <div className="info-item">
            <span className="label">H:</span>
            <span className="value">{formatPrice(data.high)}</span>
          </div>
          <div className="info-item">
            <span className="label">L:</span>
            <span className="value">{formatPrice(data.low)}</span>
          </div>
          <div className="info-item">
            <span className="label">C:</span>
            <span className="value">{formatPrice(data.close)}</span>
          </div>
          {data.volume !== undefined && (
            <div className="info-item">
              <span className="label">V:</span>
              <span className="value">{data.volume.toLocaleString()}</span>
            </div>
          )}
          {formattedDividend && (
            <div className="info-item dividend-info">
              <span className="label">배당:</span>
              <div className="value-block">
                <span className="value">{formattedDividend.date}</span>
                <span className="value">₩{formattedDividend.amount}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="info-placeholder">
          Hover over the chart to see details
        </div>
      )}
    </div>
  );
};
