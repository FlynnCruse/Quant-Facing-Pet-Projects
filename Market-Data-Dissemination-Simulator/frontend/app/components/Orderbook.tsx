'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import charts to avoid SSR issues
const CandlestickChart = dynamic(() => import('./CandlestickChart'), { ssr: false });
const DepthChart = dynamic(() => import('./DepthChart'), { ssr: false });

type OrderbookLevel = {
  price: number;
  quantity: number;
  isBuy: boolean;
};

type OrderbookProps = {
  instrumentId: number;
  symbol: string;
  depth: number;
};

const Orderbook: React.FC<OrderbookProps> = ({ instrumentId, symbol, depth }) => {
  const [bids, setBids] = useState<OrderbookLevel[]>([]);
  const [asks, setAsks] = useState<OrderbookLevel[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [activeTab, setActiveTab] = useState<'orderbook' | 'chart' | 'depth'>('orderbook');

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.instrumentId === instrumentId) {
          if (data.type === 'orderbook') {
            setBids(data.data.bids);
            setAsks(data.data.asks);
            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      setIsSubscribed(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [instrumentId]);

  // Handle subscription/unsubscription
  const toggleSubscription = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    if (isSubscribed) {
      socket.send(JSON.stringify({
        type: 'unsubscribe',
        instrumentId
      }));
      setBids([]);
      setAsks([]);
      setIsSubscribed(false);
    } else {
      socket.send(JSON.stringify({
        type: 'subscribe',
        instrumentId
      }));
      setIsSubscribed(true);
    }
  };

  // Format the price for display
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Format the quantity for display
  const formatQuantity = (quantity: number) => {
    return quantity.toLocaleString();
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{symbol}</h2>
        <div className="flex items-center space-x-4">
          <div className={`rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <button
            onClick={toggleSubscription}
            className={`px-4 py-2 rounded ${isSubscribed ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        </div>
      </div>

      {lastUpdate && (
        <div className="text-sm text-gray-400 mb-2">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {isSubscribed && (
        <div className="bg-gray-800/50 p-2 rounded mb-4 text-xs text-gray-300">
          <p><span className="font-semibold">Market details:</span> {symbol} orderbook with max depth of {depth} levels</p>
          {bids.length > 0 && asks.length > 0 && (
            <p className="mt-1">
              <span className="font-semibold">Current spread:</span> {(Math.min(...asks.map(a => a.price)) - Math.max(...bids.map(b => b.price))).toFixed(2)} points
            </p>
          )}
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab('orderbook')}
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'orderbook' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'}`}
        >
          Orderbook
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'chart' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'}`}
        >
          Price Chart
        </button>
        <button
          onClick={() => setActiveTab('depth')}
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'depth' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'}`}
        >
          Depth Chart
        </button>
      </div>
      
      {/* Tab content */}
      <div className="mb-4">
        {activeTab === 'orderbook' && (
          <div className="grid grid-cols-2 gap-4">
            {/* Asks (Sell orders) */}
            <div className="col-span-1">
              <div className="bg-gray-800 p-2 rounded mb-2">
                <h3 className="text-center text-red-400">Asks (Sell)</h3>
              </div>
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 text-sm font-bold pb-1 border-b border-gray-700">
                  <div className="text-left">Price</div>
                  <div className="text-right">Quantity</div>
                </div>
                <AnimatePresence>
                  {asks.slice(0, depth).map((level, index) => (
                    <motion.div
                      key={`ask-${level.price}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-2 text-sm py-1 border-b border-gray-800"
                    >
                      <div className="text-left text-red-400">{formatPrice(level.price)}</div>
                      <div className="text-right">{formatQuantity(level.quantity)}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Bids (Buy orders) */}
            <div className="col-span-1">
              <div className="bg-gray-800 p-2 rounded mb-2">
                <h3 className="text-center text-green-400">Bids (Buy)</h3>
              </div>
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 text-sm font-bold pb-1 border-b border-gray-700">
                  <div className="text-left">Price</div>
                  <div className="text-right">Quantity</div>
                </div>
                <AnimatePresence>
                  {bids.slice(0, depth).map((level, index) => (
                    <motion.div
                      key={`bid-${level.price}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-2 text-sm py-1 border-b border-gray-800"
                    >
                      <div className="text-left text-green-400">{formatPrice(level.price)}</div>
                      <div className="text-right">{formatQuantity(level.quantity)}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'chart' && (
          <CandlestickChart 
            instrumentId={instrumentId} 
            symbol={symbol} 
            isSubscribed={isSubscribed} 
          />
        )}
        
        {activeTab === 'depth' && (
          <DepthChart 
            instrumentId={instrumentId} 
            symbol={symbol} 
            isSubscribed={isSubscribed} 
          />
        )}
      </div>
    </div>
  );
};

export default Orderbook; 