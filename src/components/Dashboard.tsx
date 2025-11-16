import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { StockChart } from './StockChart';
import { DividendInfo } from './DividendInfo';
import { PriceLineManager } from './PriceLineManager';
import type { StockData, DividendData } from '../types';
import { generateSampleStockData, generateSampleDividends } from '../utils/sampleData';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { userData, addPriceLine, removePriceLine, updatePriceLine } = useUserData();
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [dividends, setDividends] = useState<DividendData[]>([]);
  const [symbol, setSymbol] = useState('AAPL');

  useEffect(() => {
    // In a real app, this would fetch data from Firebase or an API
    // For demo purposes, we generate sample data
    const loadData = () => {
      setStockData(generateSampleStockData(100));
      setDividends(generateSampleDividends());
    };
    loadData();
  }, [symbol]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>BaedangGraph</h1>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="symbol-selector">
          <label htmlFor="symbol">Stock Symbol:</label>
          <select
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            <option value="AAPL">AAPL - Apple Inc.</option>
            <option value="GOOGL">GOOGL - Alphabet Inc.</option>
            <option value="MSFT">MSFT - Microsoft Corporation</option>
            <option value="AMZN">AMZN - Amazon.com Inc.</option>
            <option value="TSLA">TSLA - Tesla Inc.</option>
          </select>
        </div>

        <StockChart
          data={stockData}
          priceLines={userData?.priceLines || []}
        />

        <div className="info-grid">
          <DividendInfo dividends={dividends} />
          <PriceLineManager
            priceLines={userData?.priceLines || []}
            onAdd={addPriceLine}
            onRemove={removePriceLine}
            onUpdate={updatePriceLine}
          />
        </div>

        <div className="info-section">
          <h3>About Your Personal Features</h3>
          <ul>
            <li>📊 View real-time candlestick charts with historical data</li>
            <li>💰 Track dividend payments with dates and amounts</li>
            <li>📌 Add personal price reference lines to remember your buy prices</li>
            <li>🎨 Customize line colors and labels for easy identification</li>
            <li>💾 All your data is saved securely in Firebase</li>
            <li>🔒 Your personal lines are private to your account</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
