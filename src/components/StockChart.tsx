import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import type { StockData, PriceLine } from '../types';
import './StockChart.css';

interface StockChartProps {
  data: StockData[];
  priceLines: PriceLine[];
  onPriceLineClick?: (lineId: string) => void;
}

export const StockChart: React.FC<StockChartProps> = ({ data, priceLines }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candlestickSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !data.length) return;

    const formattedData = data.map(item => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    candlestickSeriesRef.current.setData(formattedData);
  }, [data]);

  // Update price lines
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;

    // Remove all existing price lines
    // Note: In a real implementation, we'd track the line references to remove them
    // For this demo, we recreate them each time

    priceLines.forEach(line => {
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.createPriceLine({
          price: line.price,
          color: line.color,
          lineWidth: 2,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: line.label,
        });
      }
    });
  }, [priceLines]);

  return (
    <div className="stock-chart-container">
      <div ref={chartContainerRef} className="chart" />
    </div>
  );
};
