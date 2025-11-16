import React, { useMemo, useState } from 'react';
import { StockChart } from './components/StockChart';
import { PriceLineManager } from './components/PriceLineManager';
import type { StockData, DividendData, PriceLine } from './types';
import { generateSampleStockData, generateSampleDividends } from './utils/sampleData';
import { DividendRangeAnalysis } from './components/DividendRangeAnalysis';
import { buildDividendRangeStats } from './utils/dividendAnalysis';
import './components/Dashboard.css';

// Demo component to showcase the dashboard without authentication
export const DemoApp: React.FC = () => {
  const [stockData] = useState<StockData[]>(generateSampleStockData(100));
  const [dividends] = useState<DividendData[]>(generateSampleDividends());
  const [priceLines, setPriceLines] = useState<PriceLine[]>([
    {
      id: 'line-1',
      price: 155.5,
      label: 'My Buy Price',
      color: '#e74c3c'
    }
  ]);
  const [symbol, setSymbol] = useState('AAPL');
  const [showDividends, setShowDividends] = useState(true);
  const dividendRangeStats = useMemo(() => buildDividendRangeStats(stockData, dividends), [stockData, dividends]);

  const handleAddPriceLine = (line: Omit<PriceLine, 'id'>) => {
    const newLine: PriceLine = {
      ...line,
      id: `line-${Date.now()}`
    };
    setPriceLines([...priceLines, newLine]);
  };

  const handleRemovePriceLine = (lineId: string) => {
    setPriceLines(priceLines.filter(line => line.id !== lineId));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>BaedangGraph</h1>
          <div className="user-info">
            <span className="user-email">demo@example.com</span>
            <button className="logout-btn">Logout</button>
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
          <button
            type="button"
            className="volume-toggle"
            onClick={() => setShowDividends(prev => !prev)}
          >
            {showDividends ? '배당 숨기기' : '배당 표시'}
          </button>
        </div>

        <div className="chart-wrapper">
          <StockChart
            data={stockData}
            priceLines={priceLines}
            dividends={dividends}
            showDividends={showDividends}
          />
        </div>

        <div className="info-grid">
          <DividendRangeAnalysis stats={dividendRangeStats} loading={false} />
          <PriceLineManager
            priceLines={priceLines}
            onAdd={handleAddPriceLine}
            onRemove={handleRemovePriceLine}
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
