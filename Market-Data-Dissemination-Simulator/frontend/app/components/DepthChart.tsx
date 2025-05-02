'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';

type DepthChartProps = {
  instrumentId: number;
  symbol: string;
  isSubscribed: boolean;
};

interface DepthDataPoint {
  price: number;
  bidVolume: number;
  askVolume: number;
}

const DepthChart: React.FC<DepthChartProps> = ({ instrumentId, symbol, isSubscribed }) => {
  const [data, setData] = useState<DepthDataPoint[]>([]);
  const [midPrice, setMidPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and update depth data
  useEffect(() => {
    if (!isSubscribed) {
      setData([]);
      return;
    }
    
    let intervalId: NodeJS.Timeout | undefined;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/api/chart/depth/${instrumentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch depth data');
        }
        
        const rawData = await response.json();
        
        if (!rawData || !rawData.bids || !rawData.asks) {
          throw new Error('Invalid depth data format');
        }
        
        // Process data for recharts
        // Format as accumulative depth volume at each price level
        const bidMap = new Map<number, number>();
        let cumulativeBidVolume = 0;
        
        // Sort bids in descending order (highest price first)
        const sortedBids = [...rawData.bids].sort((a, b) => b.price - a.price);
        
        // Calculate cumulative volume for bids
        sortedBids.forEach((item: { price: number; volume: number }) => {
          cumulativeBidVolume += item.volume;
          bidMap.set(item.price, cumulativeBidVolume);
        });
        
        const askMap = new Map<number, number>();
        let cumulativeAskVolume = 0;
        
        // Sort asks in ascending order (lowest price first)
        const sortedAsks = [...rawData.asks].sort((a, b) => a.price - b.price);
        
        // Calculate cumulative volume for asks
        sortedAsks.forEach((item: { price: number; volume: number }) => {
          cumulativeAskVolume += item.volume;
          askMap.set(item.price, cumulativeAskVolume);
        });
        
        // Create a sorted array of all prices
        const allPrices = [...new Set([
          ...sortedBids.map((item: { price: number }) => item.price),
          ...sortedAsks.map((item: { price: number }) => item.price)
        ])].sort((a, b) => a - b);
        
        // Calculate mid price for reference line
        if (sortedBids.length > 0 && sortedAsks.length > 0) {
          const highestBid = sortedBids[0].price;
          const lowestAsk = sortedAsks[0].price;
          setMidPrice((highestBid + lowestAsk) / 2);
        }
        
        // Create data points with cumulative bid and ask values
        const chartData: DepthDataPoint[] = allPrices.map(price => ({
          price,
          bidVolume: bidMap.get(price) || 0,
          askVolume: askMap.get(price) || 0
        }));
        
        setData(chartData);
        setError(null);
      } catch (err) {
        console.error('Error fetching depth data:', err);
        setError('Failed to load depth data');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchData();
    
    // Set up interval for updates
    intervalId = setInterval(fetchData, 2000);
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [instrumentId, isSubscribed]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-700 shadow-lg text-xs">
          <p className="mb-1 font-bold">Price: ${label.toFixed(2)}</p>
          <p className="text-green-400">Bid Volume: {payload[0]?.value.toFixed(2) || 0}</p>
          <p className="text-red-400">Ask Volume: {payload[1]?.value.toFixed(2) || 0}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{symbol} Depth Chart</h2>
        {isLoading && <div className="text-xs text-blue-400">Loading...</div>}
      </div>
      
      {error && (
        <div className="bg-red-900/30 text-red-300 p-2 mb-4 rounded text-sm">
          {error}
        </div>
      )}
      
      {!isSubscribed ? (
        <div className="flex items-center justify-center h-[300px] bg-gray-800/50 rounded">
          <p className="text-gray-400">Subscribe to {symbol} to see depth chart</p>
        </div>
      ) : (
        <>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="price" 
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <YAxis 
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Bid Area */}
                <Area 
                  type="monotone" 
                  dataKey="bidVolume" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.5}
                  name="Bid Cumulative Volume"
                />
                
                {/* Ask Area */}
                <Area 
                  type="monotone" 
                  dataKey="askVolume" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.5}
                  name="Ask Cumulative Volume"
                />
                
                {/* Mid price reference line */}
                {midPrice && (
                  <ReferenceLine 
                    x={midPrice} 
                    stroke="#9CA3AF" 
                    strokeDasharray="3 3"
                    label={{ value: 'Mid', position: 'top', fill: '#9CA3AF' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-2 text-xs text-gray-400">
            <p>X-axis: Price • Y-axis: Cumulative Volume • Orderbook: {symbol}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default DepthChart; 