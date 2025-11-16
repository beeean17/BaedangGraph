import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  type BusinessDay,
  type SeriesMarker,
} from 'lightweight-charts';
import type { StockData, PriceLine as PriceLineType, DividendData, DividendRangeStat } from '../types';
import './StockChart.css';

const formatDateLabel = (time: Time | string | number | undefined) => {
  if (!time) return '';
  if (typeof time === 'string') {
    return time.split('T')[0];
  }
  if (typeof time === 'number') {
    return new Date(time * 1000).toISOString().split('T')[0];
  }
  return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
};

const normalizeDateString = (value: string) => {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
};

const toBusinessDay = (dateString: string): BusinessDay | null => {
  const normalized = normalizeDateString(dateString);
  if (!normalized) return null;
  const [yearStr, monthStr, dayStr] = normalized.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if ([year, month, day].some(value => Number.isNaN(value))) {
    return null;
  }
  return { year, month: month as BusinessDay['month'], day: day as BusinessDay['day'] };
};

const toTimestamp = (dateString: string): number | null => {
  const normalized = normalizeDateString(dateString);
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const toChartTime = (dateString: string): Time | null => {
  const businessDay = toBusinessDay(dateString);
  if (businessDay) return businessDay;
  const timestamp = toTimestamp(dateString);
  return timestamp !== null ? (timestamp / 1000) as Time : null;
};

interface StockChartProps {
  data: StockData[];
  priceLines: PriceLineType[];
  dividends?: DividendData[];
  showVolume?: boolean;
  showDividends?: boolean;
  onCrosshairMove?: (data: StockData | null) => void;
  dividendRangeStats?: DividendRangeStat[];
}

export const StockChart: React.FC<StockChartProps> = ({
  data,
  priceLines,
  dividends = [],
  showVolume = true,
  showDividends = true,
  onCrosshairMove,
  dividendRangeStats = [],
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const crosshairMoveHandlerRef = useRef<((param: MouseEventParams) => void) | null>(null);
  const dataRef = useRef<StockData[]>([]);
  const priceLinesRef = useRef<Array<ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']>>>([]);
  const [dividendMarkers, setDividendMarkers] = useState<Array<{ id: string; left: number; date: string; amount: number }>>([]);
  const [activeDividendId, setActiveDividendId] = useState<string | null>(null);

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
        highlight: style.getPropertyValue('--color-accent') || '#ffbf47',
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
        vertLine: {
          color: colors.crosshair,
          labelBackgroundColor: colors.highlight,
          labelVisible: true,
        },
        horzLine: {
          color: colors.crosshair,
          labelBackgroundColor: colors.highlight,
          labelVisible: true,
        },
      },
      localization: {
        timeFormatter: (businessDayOrTimestamp: Time | number | string | undefined) =>
          formatDateLabel(businessDayOrTimestamp) ?? '',
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: {
        type: 'price',
        precision: 0,
        minMove: 1,
      },
    });

    candlestickSeriesRef.current.applyOptions({
      lastValueVisible: false,
      priceLineVisible: false,
    });

    volumeSeriesRef.current = chart.addHistogramSeries({
      priceScaleId: 'volume',
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      lastValueVisible: false,
      color: '#26a69a',
      baseLineVisible: false,
    });

    volumeSeriesRef.current.applyOptions({
      priceLineVisible: false,
      lastValueVisible: false,
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

        const normalizedTime = formatDateLabel(param.time as Time | string | number);

        const matchedVolume = dataRef.current.find(item => item.time === normalizedTime)?.volume;

        if (!normalizedTime) {
          onCrosshairMove(null);
          return;
        }

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

  const updateDividendMarkers = useCallback(() => {
    if (!chartRef.current || !chartContainerRef.current || !dividends.length || !showDividends) {
      setDividendMarkers([]);
      setActiveDividendId(null);
      return;
    }

    const timeScale = chartRef.current.timeScale();
    const container = chartContainerRef.current;
    const styles = getComputedStyle(container);
    const paddingLeft = parseFloat(styles.paddingLeft || '0');
    const paddingRight = parseFloat(styles.paddingRight || '0');
    const innerWidth = container.clientWidth - paddingLeft - paddingRight;

    const markers = dividends.reduce<Array<{ id: string; left: number; date: string; amount: number }>>((acc, dividend, index) => {
      const time = toChartTime(dividend.date);
      const coordinate = time ? timeScale.timeToCoordinate(time) : null;
      if (coordinate === null || coordinate === undefined) {
        return acc;
      }
      const relativeLeft = Number(coordinate);
      if (Number.isNaN(relativeLeft) || relativeLeft < 0 || relativeLeft > innerWidth) {
        return acc;
      }
      acc.push({
        id: `${dividend.date}-${index}`,
        left: relativeLeft + paddingLeft,
        date: dividend.date,
        amount: dividend.amount,
      });
      return acc;
    }, []);

    setDividendMarkers(markers);
    setActiveDividendId(prev => (markers.some(marker => marker.id === prev) ? prev : null));
  }, [dividends, showDividends]);

  useEffect(() => {
    updateDividendMarkers();
  }, [updateDividendMarkers, data]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const handler = () => updateDividendMarkers();
    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange(handler);
    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handler);
    };
  }, [updateDividendMarkers]);

  useEffect(() => {
    const handleResize = () => updateDividendMarkers();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDividendMarkers]);

  // Update chart data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !data) return;

    const formattedData = data
      .map(item => {
        const time = toChartTime(item.time);
        if (!time) {
          return null;
        }
        return {
          time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        };
      })
      .filter((item): item is CandlestickData<Time> => item !== null);

    candlestickSeriesRef.current.setData(formattedData);
    if (formattedData.length) {
      chartRef.current?.timeScale().fitContent();
    }
    dataRef.current = data.map(point => ({
      ...point,
      time: normalizeDateString(point.time),
    }));
  }, [data]);

  // Update volume histogram data
  useEffect(() => {
    if (!volumeSeriesRef.current) return;
    const formattedVolume = data.reduce<HistogramData<Time>[]>((acc, item) => {
      const time = toChartTime(item.time);
      if (!time) {
        return acc;
      }
      acc.push({
        time,
        value: item.volume ?? 0,
        color: item.close >= item.open ? '#26a69a' : '#ef5350',
      });
      return acc;
    }, []);

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

  useEffect(() => {
    const series = candlestickSeriesRef.current;
    if (!series) return;

    if (!dividendRangeStats.length) {
      series.setMarkers([]);
      return;
    }

    const markerEntries: Array<{ marker: SeriesMarker<Time>; timestamp: number }> = [];
    const markerKeys = new Set<string>();

    const pushMarker = (
      point: NonNullable<DividendRangeStat['high']>,
      position: 'aboveBar' | 'belowBar',
      color: string,
    ) => {
      const normalizedDate = normalizeDateString(point.date);
      const key = `${normalizedDate}-${position}`;
      if (markerKeys.has(key)) {
        return;
      }
      const time = toChartTime(normalizedDate);
      const timestamp = toTimestamp(normalizedDate);
      if (!time || timestamp === null) {
        return;
      }
      markerKeys.add(key);
      markerEntries.push({
        timestamp,
        marker: {
          time,
          position,
          shape: 'circle',
          color,
          size: 1,
          text: Math.trunc(point.value).toString(),
        },
      });
    };

    dividendRangeStats.forEach((stat) => {
      if (stat.high) {
        pushMarker(stat.high, 'aboveBar', '#a7f294');
      }
      if (stat.low) {
        pushMarker(stat.low, 'belowBar', '#ff6f91');
      }
    });

    markerEntries.sort((a, b) => a.timestamp - b.timestamp);
    series.setMarkers(markerEntries.map(entry => entry.marker));
  }, [dividendRangeStats]);

  return (
    <div className="stock-chart-container">
      <div ref={chartContainerRef} className="chart" />
      {showDividends && dividendMarkers.length > 0 && (
        <div className="dividend-overlay" aria-label="dividend markers">
          {dividendMarkers.map(marker => (
            <div
              key={marker.id}
              className="dividend-marker"
              style={{ left: `${marker.left}px` }}
            >
              <div className="dividend-marker-line" />
              <button
                type="button"
                className="dividend-marker-button"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveDividendId(prev => (prev === marker.id ? null : marker.id));
                }}
              >
                D
              </button>
              {activeDividendId === marker.id && (
                  <div className="dividend-tooltip" style={{ pointerEvents: 'auto' }}>
                  <div>날짜: {new Date(marker.date).toLocaleDateString('ko-KR')}</div>
                  <div>배당금: ₩{Math.trunc(marker.amount).toLocaleString()}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
