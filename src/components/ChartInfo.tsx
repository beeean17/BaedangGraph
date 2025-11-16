import React from 'react';
import type { StockData } from '../types';
import './ChartInfo.css';

type ChartInfoTime = string | { day: number; month: number; year: number };
// We might get a partial data point or a full one from the chart
type ChartInfoData = Omit<Partial<StockData>, 'time'> & { time?: ChartInfoTime };

interface ChartInfoProps {
  data: ChartInfoData | null;
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

export const ChartInfo: React.FC<ChartInfoProps> = ({ data }) => {
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
        </>
      ) : (
        <div className="info-placeholder">
          Hover over the chart to see details
        </div>
      )}
    </div>
  );
};
