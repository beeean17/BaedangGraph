import React from 'react';
import type { DividendData } from '../types';
import './DividendInfo.css';

interface DividendInfoProps {
  dividends: DividendData[];
}

export const DividendInfo: React.FC<DividendInfoProps> = ({ dividends }) => {
  return (
    <div className="dividend-info-container">
      <h3>Dividend Information</h3>
      {dividends.length === 0 ? (
        <p className="no-dividends">No dividend data available</p>
      ) : (
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
                  {dividend.currency || '$'}{dividend.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
