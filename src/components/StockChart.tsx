import React, { useEffect, useRef } from 'react';
import { createChart, LineStyle, CrosshairMode } from 'lightweight-charts';
import type { StockData, PriceLine as PriceLineType } from '../types';
import './StockChart.css';

interface StockChartProps {
  data: StockData[];
  priceLines: PriceLineType[];
  onCrosshairMove?: (data: StockData | null) => void;
}

export const StockChart: React.FC<StockChartProps> = ({ data, priceLines, onCrosshairMove }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candlestickSeriesRef = useRef<ReturnType<typeof chartRef.current.addCandlestickSeries> | null>(null);
  const priceLinesRef = useRef<any[]>([]);

  // Effect for chart creation and resizing
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const getThemeColors = () => {
      const style = getComputedStyle(document.body);
      return {
        background: style.getPropertyValue('--color-bg'),
        text: style.getPropertyValue('--color-text-primary'),
        grid: style.getPropertyValue('--color-border'),
        crosshair: style.getPropertyValue('--color-text-secondary'),
      };
    };
    const colors = getThemeColors();

    const chart = createChart(chartContainerRef.current, {
      autosize: false,
      layout: {
        background: { color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      timeScale: {
        borderColor: colors.grid,
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: colors.grid,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.crosshair },
        horzLine: { color: colors.crosshair },
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Perform an initial resize to fit the container immediately
    chart.resize(
      chartContainerRef.current.clientWidth,
      chartContainerRef.current.clientHeight
    );

    // Then, observe subsequent size changes
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.resize(width, height);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    // Subscribe to crosshair move event
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        const dataPoint = param.seriesData.get(candlestickSeriesRef.current);
        if (dataPoint) {
          // Lightweight-charts time can be an object { year, month, day } or a string
          const time = typeof param.time === 'object'
            ? `${param.time.year}-${String(param.time.month).padStart(2, '0')}-${String(param.time.day).padStart(2, '0')}`
            : param.time;

          onCrosshairMove({
            time: time as string, // Cast to string as StockData expects string
            open: (dataPoint as StockData).open,
            high: (dataPoint as StockData).high,
            low: (dataPoint as StockData).low,
            close: (dataPoint as StockData).close,
            volume: (dataPoint as StockData).volume,
          });
        } else {
          onCrosshairMove(null);
        }
      });
    }

    return () => {
      resizeObserver.disconnect();
      if (onCrosshairMove) {
        chart.unsubscribeCrosshairMove((param) => {
          // Empty callback for unsubscribe
        });
      }
      chart.remove();
    };
  }, [onCrosshairMove]); // Add onCrosshairMove to dependencies

  // Update chart data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !data) return;

    const formattedData = data.map(item => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    candlestickSeriesRef.current.setData(formattedData);
    if (formattedData.length) {
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  // Update price lines
  useEffect(() => {
    const series = candlestickSeriesRef.current;
    if (!series) return;

    // Clear old price lines
    priceLinesRef.current.forEach(line => {
      if (line) series.removePriceLine(line);
    });
    priceLinesRef.current = [];

    // Create new price lines
    const newPriceLines = priceLines.map(line => {
      return series.createPriceLine({
        price: line.price,
        color: line.color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: line.label,
      });
    });
    priceLinesRef.current = newPriceLines;
  }, [priceLines]);

  return (
    <div className="stock-chart-container">
      <div ref={chartContainerRef} className="chart" />
    </div>
  );
};
