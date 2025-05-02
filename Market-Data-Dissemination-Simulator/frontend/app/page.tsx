'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the orderbook component to avoid SSR issues with WebSocket
const Orderbook = dynamic(() => import('./components/Orderbook'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-800 py-10">
      <div className="container mx-auto px-4">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Market Data Dissemination Simulator</h1>
          <p className="text-gray-300">
            Real-time order book visualization using WebSockets
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Orderbook instrumentId={1} symbol="AAPL" depth={10} />
          <Orderbook instrumentId={2} symbol="MSFT" depth={5} />
        </div>

        <footer className="mt-10 text-center text-gray-400 text-sm">
          <p>Market Data Dissemination Simulator - Demonstrating middleware concepts with gRPC</p>
        </footer>
      </div>
    </main>
  );
}
