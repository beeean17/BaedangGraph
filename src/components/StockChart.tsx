import React, { useEffect, useRef } from 'react';
import {
  createChart,
  LineStyle,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type CandlestickData,
  type HistogramData,
  type Time,
} from 'lightweight-charts';
import type { StockData, PriceLine as PriceLineType } from '../types';
import './StockChart.css';

interface StockChartProps {
  data: StockData[];
  priceLines: PriceLineType[];
  showVolume?: boolean;
  onCrosshairMove?: (data: StockData | null) => void;
}

export const StockChart: React.FC<StockChartProps> = ({ data, priceLines, showVolume = true, onCrosshairMove }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const crosshairMoveHandlerRef = useRef<((param: MouseEventParams) => void) | null>(null);
  const dataRef = useRef<StockData[]>([]);
  const priceLinesRef = useRef<Array<ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']>>>([]);

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
      autoSize: false,
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
      priceFormat: {
        type: 'price',
        precision: 0,
        minMove: 1,
      },
    });

    volumeSeriesRef.current = chart.addHistogramSeries({
      priceScaleId: 'volume',
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      color: '#26a69a',
      baseLineVisible: false,
    });

    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.1, bottom: showVolume ? 0.2 : 0.05 },
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: showVolume ? { top: 0.8, bottom: 0 } : { top: 1, bottom: 0 },
    });

    volumeSeriesRef.current.applyOptions({ visible: showVolume });

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
      const crosshairHandler = (param: MouseEventParams) => {
        if (!candlestickSeriesRef.current || !param.time) {
          onCrosshairMove(null);
          return;
        }

        const series = candlestickSeriesRef.current;
        const dataPoint = param.seriesData.get(series) as CandlestickData<Time> | undefined;
        if (!dataPoint || typeof dataPoint.open !== 'number') {
          onCrosshairMove(null);
          return;
        }

        const normalizedTime = typeof param.time === 'object'
          ? `${param.time.year}-${String(param.time.month).padStart(2, '0')}-${String(param.time.day).padStart(2, '0')}`
          : typeof param.time === 'number'
            ? new Date(param.time * 1000).toISOString().split('T')[0]
            : (param.time as string);

        const matchedVolume = dataRef.current.find(item => item.time === normalizedTime)?.volume;

        onCrosshairMove({
          time: normalizedTime,
          open: Math.trunc(dataPoint.open),
          high: Math.trunc(dataPoint.high),
          low: Math.trunc(dataPoint.low),
          close: Math.trunc(dataPoint.close),
          volume: matchedVolume !== undefined ? Math.trunc(matchedVolume) : undefined,
        });
      };

      chart.subscribeCrosshairMove(crosshairHandler);
      crosshairMoveHandlerRef.current = crosshairHandler;
    }

    return () => {
      resizeObserver.disconnect();
      if (crosshairMoveHandlerRef.current) {
        chart.unsubscribeCrosshairMove(crosshairMoveHandlerRef.current);
        crosshairMoveHandlerRef.current = null;
      }
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [onCrosshairMove]);

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
    dataRef.current = data;
  }, [data]);

  // Update volume histogram data
  useEffect(() => {
    if (!volumeSeriesRef.current) return;
    const formattedVolume: HistogramData<Time>[] = data.map(item => ({
      time: item.time,
      value: item.volume ?? 0,
      color: item.close >= item.open ? '#26a69a' : '#ef5350',
    }));

    volumeSeriesRef.current.setData(formattedVolume);
  }, [data]);

  // Toggle volume visibility
  useEffect(() => {
    if (!volumeSeriesRef.current || !chartRef.current) return;
    volumeSeriesRef.current.applyOptions({ visible: showVolume });

    chartRef.current.priceScale('right').applyOptions({
      scaleMargins: { top: 0.1, bottom: showVolume ? 0.2 : 0.05 },
    });

    chartRef.current.priceScale('volume').applyOptions({
      scaleMargins: showVolume ? { top: 0.8, bottom: 0 } : { top: 1, bottom: 0 },
    });
  }, [showVolume]);

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
