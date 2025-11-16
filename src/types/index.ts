export interface StockData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface DividendData {
  date: string;
  amount: number;
  currency?: string;
}

export interface DividendRangeStat {
  id: string;
  startDate: string;
  endDate: string;
  startDividendAmount: number;
  endDividendAmount: number;
  high?: {
    value: number;
    date: string;
  };
  low?: {
    value: number;
    date: string;
  };
}

export interface PriceLine {
  id: string;
  price: number;
  label: string;
  color: string;
}

export interface UserData {
  uid: string;
  email: string;
}

export interface ChartSettings {
  symbol: string;
  interval: '1D' | '1W' | '1M';
  showVolume: boolean;
  showDividends: boolean;
}
