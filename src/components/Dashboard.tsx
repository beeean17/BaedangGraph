import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { useStockData } from '../hooks/useStockData';
import { StockChart } from './StockChart';
import { PriceLineManager } from './PriceLineManager';
import { ChartInfo } from './ChartInfo';
import { DividendRangeAnalysis } from './DividendRangeAnalysis';
import type { StockData } from '../types';
import { buildDividendRangeStats } from '../utils/dividendAnalysis';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { priceLines, addPriceLine, removePriceLine, updatePriceLine } = useUserData();
  const [symbol, setSymbol] = useState('AAPL'); // Default symbol
  const { stockData, dividends, loading, error } = useStockData(symbol);
  const [chartCrosshairData, setChartCrosshairData] = useState<StockData | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showDividends, setShowDividends] = useState(true);
  const dividendRangeStats = useMemo(
    () => buildDividendRangeStats(stockData, dividends),
    [stockData, dividends],
  );

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
            {/* Example for a user-defined stock ID from the markdown */}
            <option value="475080">475080 - (Custom Stock)</option>
          </select>
          <button
            type="button"
            className="volume-toggle"
            onClick={() => setShowVolume(prev => !prev)}
          >
            {showVolume ? '거래량 숨기기' : '거래량 표시'}
          </button>
          <button
            type="button"
            className="volume-toggle"
            onClick={() => setShowDividends(prev => !prev)}
          >
            {showDividends ? '배당 숨기기' : '배당 표시'}
          </button>
          <ChartInfo data={chartCrosshairData} />
        </div>

        <div className="chart-wrapper">
          {loading && <div className="info-section">Loading chart data...</div>}
          {error && <div className="info-section error-message">{error}</div>}
          {!loading && !error && (
            <StockChart
              data={stockData}
              priceLines={priceLines}
              dividends={dividends}
              showVolume={showVolume}
              showDividends={showDividends}
              onCrosshairMove={setChartCrosshairData}
            />
          )}
        </div>

        <div className="info-grid">
          <DividendRangeAnalysis stats={dividendRangeStats} loading={loading} />
          <PriceLineManager
            priceLines={priceLines}
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

