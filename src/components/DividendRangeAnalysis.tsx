import React from 'react';
import type { DividendRangeStat } from '../types';
import { normalizeDateString } from '../utils/date';
import './DividendRangeAnalysis.css';

interface DividendRangeAnalysisProps {
  stats: DividendRangeStat[];
  loading: boolean;
}

const formatDate = (date: string) => {
  const normalized = normalizeDateString(date);
  if (!normalized) return '-';
  return new Date(`${normalized}T00:00:00`).toLocaleDateString('ko-KR');
};
const formatDays = (days?: number) => {
  if (days === undefined) return '-';
  const sign = days > 0 ? '+' : days < 0 ? '-' : '';
  return `${sign}${Math.abs(days)}일`;
};

export const DividendRangeAnalysis: React.FC<DividendRangeAnalysisProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="dividend-range-panel">
        <h3>배당 구간 분석</h3>
        <p className="analysis-placeholder">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!stats.length) {
    return (
      <div className="dividend-range-panel">
        <h3>배당 구간 분석</h3>
        <p className="analysis-placeholder">표시할 배당 구간이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="dividend-range-panel">
      <h3>배당 구간 분석</h3>
      <ul className="dividend-range-list">
        {stats.map((stat) => (
          <li key={stat.id} className="dividend-range-item">
            <div className="range-header">
              <span className="range-dates">{formatDate(stat.startDate)} → {formatDate(stat.endDate)}</span>
              <span className="range-amount">배당 ₩{Math.trunc(stat.startDividendAmount).toLocaleString()}</span>
            </div>
            <div className="range-row">
              <span className="label">최고가 (H)</span>
              {stat.high ? (
                <span className="value">
                  ₩{stat.high.value.toLocaleString()} · {formatDate(stat.high.date)}
                  <span className="offsets">
                    <span>이전 배당 {formatDays(stat.high.daysFromStart)}</span>
                    <span>다음 배당 {formatDays(stat.high.daysToEnd)}</span>
                  </span>
                </span>
              ) : (
                <span className="value muted">데이터 없음</span>
              )}
            </div>
            <div className="range-row">
              <span className="label">최저가 (L)</span>
              {stat.low ? (
                <span className="value">
                  ₩{stat.low.value.toLocaleString()} · {formatDate(stat.low.date)}
                  <span className="offsets">
                    <span>이전 배당 {formatDays(stat.low.daysFromStart)}</span>
                    <span>다음 배당 {formatDays(stat.low.daysToEnd)}</span>
                  </span>
                </span>
              ) : (
                <span className="value muted">데이터 없음</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
