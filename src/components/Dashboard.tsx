import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { useStockData } from '../hooks/useStockData';
import { useStockList } from '../hooks/useStockList';
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
  const [symbol, setSymbol] = useState('');
  const { stocks, loading: stockListLoading, error: stockListError } = useStockList();
  const { stockData, dividends, loading, error } = useStockData(symbol);
  const [chartCrosshairData, setChartCrosshairData] = useState<StockData | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showDividends, setShowDividends] = useState(true);
  const dividendRangeStats = useMemo(
    () => buildDividendRangeStats(stockData, dividends),
    [stockData, dividends],
  );
  const hasChartData = stockData.length > 0;

  const sortedStocks = useMemo(() => {
    const periodPriority: Record<string, number> = { '월중': 0, '월말': 1 };
    return [...stocks].sort((a, b) => {
      const periodOrderA = periodPriority[a.period ?? ''] ?? 2;
      const periodOrderB = periodPriority[b.period ?? ''] ?? 2;
      if (periodOrderA !== periodOrderB) {
        return periodOrderA - periodOrderB;
      }
      return a.id.localeCompare(b.id, 'ko');
    });
  }, [stocks]);

  const formatStockLabel = (stock: (typeof stocks)[number]) => {
    const periodLabel = stock.period === '월중' || stock.period === '월말' ? stock.period : stock.period ?? '';
    const namePart = stock.name ?? '';
    return [stock.id, periodLabel, namePart].filter(Boolean).join(' ');
  };

  useEffect(() => {
    if (!symbol && sortedStocks.length > 0) {
      setSymbol(sortedStocks[0].id);
    }
  }, [symbol, sortedStocks]);

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
          <select
            id="symbol"
            value={symbol}
            disabled={stockListLoading || !sortedStocks.length}
            onChange={(e) => setSymbol(e.target.value)}
            aria-label="Select stock symbol"
          >
            {!sortedStocks.length && <option value="">종목을 불러오는 중...</option>}
            {sortedStocks.map(stock => (
              <option key={stock.id} value={stock.id}>
                {formatStockLabel(stock)}
              </option>
            ))}
          </select>
          {stockListError && (
            <span className="stock-error">종목 목록을 불러오지 못했습니다.</span>
          )}
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
          {error && (
            <div className="info-section error-message">{error}</div>
          )}

          {hasChartData && !error && (
            <>
              <StockChart
                data={stockData}
                priceLines={priceLines}
                dividends={dividends}
                showVolume={showVolume}
                showDividends={showDividends}
                dividendRangeStats={dividendRangeStats}
                onCrosshairMove={setChartCrosshairData}
              />
              {loading && (
                <div className="chart-loading-overlay">
                  <span>새 데이터를 불러오는 중...</span>
                </div>
              )}
            </>
          )}

          {!error && !hasChartData && (
            <div className="chart-status-card">
              {loading ? '차트 데이터를 불러오는 중입니다...' : '표시할 차트 데이터가 없습니다.'}
            </div>
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

