'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';

type CandlestickChartProps = {
  instrumentId: number;
  symbol: string;
  isSubscribed: boolean;
};

interface PriceDataPoint {
  time: string;
  timeRaw: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma: number | null;
  priceDirection: 'up' | 'down';
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ instrumentId, symbol, isSubscribed }) => {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and update data
  useEffect(() => {
    if (!isSubscribed) {
      setData([]);
      return;
    }
    
    let intervalId: NodeJS.Timeout | undefined;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/api/chart/history/${instrumentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        
        const rawData = await response.json();
        
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          throw new Error('Invalid chart data format');
        }
        
        // Process data to include all OHLC values and formatted time
        const processedData = rawData.map((item): PriceDataPoint => ({
          time: new Date(item.time * 1000).toLocaleTimeString(),
          timeRaw: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          sma: null,
          priceDirection: item.close >= item.open ? 'up' : 'down'
        }));
        
        // Calculate simple moving average (SMA)
        const period = 20;
        if (processedData.length >= period) {
          for (let i = period - 1; i < processedData.length; i++) {
            const sum = processedData
              .slice(i - period + 1, i + 1)
              .reduce((total, item) => total + item.close, 0);
            // Explicitly cast to PriceDataPoint to avoid type errors
            (processedData[i] as PriceDataPoint).sma = sum / period;
          }
        }
        
        // Sort by time to ensure proper display
        processedData.sort((a, b) => a.timeRaw - b.timeRaw);
        
        setData(processedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchData();
    
    // Set up interval for updates
    intervalId = setInterval(fetchData, 5000);
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [instrumentId, isSubscribed]);
  
  // Custom tooltip to show OHLC data
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      if (!item) return null;
      
      const priceColor = item.priceDirection === 'up' ? '#10B981' : '#EF4444';
      
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-700 shadow-lg text-xs">
          <p className="mb-1 font-bold">{label}</p>
          <p className="text-green-400">Open: ${item.open.toFixed(2)}</p>
          <p className="text-blue-400">High: ${item.high.toFixed(2)}</p>
          <p className="text-yellow-400">Low: ${item.low.toFixed(2)}</p>
          <p style={{ color: priceColor }}>Close: ${item.close.toFixed(2)}</p>
          <p className="text-blue-300">Volume: {item.volume}</p>
          {item.sma !== null && (
            <p className="text-orange-400">SMA(20): ${item.sma.toFixed(2)}</p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{symbol} Price Chart</h2>
        {isLoading && <div className="text-xs text-blue-400">Loading...</div>}
      </div>
      
      {error && (
        <div className="bg-red-900/30 text-red-300 p-2 mb-4 rounded text-sm">
          {error}
        </div>
      )}
      
      {!isSubscribed ? (
        <div className="flex items-center justify-center h-[400px] bg-gray-800/50 rounded">
          <p className="text-gray-400">Subscribe to {symbol} to see price chart</p>
        </div>
      ) : (
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="time" />
              <YAxis 
                domain={['auto', 'auto']} 
                tickFormatter={(value) => value.toFixed(2)}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                dataKey="volume"
                name="Volume"
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <Legend />
              
              {/* Close price line */}
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#3B82F6" 
                dot={false} 
                name="Close Price" 
              />
              
              {/* High price line */}
              <Line 
                type="monotone" 
                dataKey="high" 
                stroke="#10B981" 
                dot={false} 
                name="High" 
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              
              {/* Low price line */}
              <Line 
                type="monotone" 
                dataKey="low" 
                stroke="#EF4444" 
                dot={false} 
                name="Low" 
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              
              {/* SMA line */}
              <Line 
                type="monotone" 
                dataKey="sma" 
                stroke="#F59E0B" 
                dot={false} 
                name="SMA (20)" 
              />
              
              {/* Volume bars */}
              <Bar 
                yAxisId="right"
                dataKey="volume" 
                name="Volume"
                fill="#60A5FA"
                opacity={0.3}
              />
              
              {/* Last price reference line */}
              {data.length > 0 && (
                <ReferenceLine 
                  y={data[data.length - 1].close} 
                  stroke="#9CA3AF" 
                  strokeDasharray="3 3" 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-400">
        <p>Chart timeframe: 1 minute • SMA Period: 20 • Orderbook: {symbol}</p>
      </div>
    </div>
  );
};

export default CandlestickChart; 