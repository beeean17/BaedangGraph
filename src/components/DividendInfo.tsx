import React from 'react';
import type { DividendData } from '../types';
import './DividendInfo.css';

interface DividendInfoProps {
  dividends: DividendData[];
  loading: boolean;
}

export const DividendInfo: React.FC<DividendInfoProps> = ({ dividends, loading }) => {
  const renderContent = () => {
    if (loading) {
      return <p className="no-dividends">Loading...</p>;
    }
    if (dividends.length === 0) {
      return <p className="no-dividends">No dividend data available</p>;
    }
    return (
      <div className="dividend-list">
        {dividends.map((dividend, index) => (
          <div key={index} className="dividend-item">
            <div className="dividend-date">
              <span className="label">Date:</span>
              <span className="value">{new Date(dividend.date).toLocaleDateString()}</span>
            </div>
            <div className="dividend-amount">
              <span className="label">Amount:</span>
              <span className="value">
                ₩{Math.trunc(dividend.amount).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dividend-info-container">
      <h3>Dividend Information</h3>
      {renderContent()}
    </div>
  );
};
