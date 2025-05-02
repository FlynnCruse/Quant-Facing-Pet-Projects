const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const WebSocket = require('ws');
const { 
  priceHistory, 
  depthData, 
  addCandleToHistory, 
  updateDepthData, 
  getMidPrice 
} = require('./historyData');

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Instruments data
const instruments = {
  1: { id: 1, symbol: 'AAPL', name: 'Apple Inc.', levels: 10 },
  2: { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', levels: 5 },
};

// Active subscriptions
const subscriptions = {};

// Orderbook data (simulated)
let orderbooks = {
  1: { // AAPL
    bids: [],
    asks: [],
  },
  2: { // MSFT
    bids: [],
    asks: [],
  }
};

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// Generate random order book data
function generateOrderBook(instrumentId) {
  const instrument = instruments[instrumentId];
  if (!instrument) return null;
  
  const basePrice = instrumentId === 1 ? 150 : 350; // AAPL ~150, MSFT ~350
  const bids = [];
  const asks = [];
  
  // Generate bids (slightly below base price)
  for (let i = 0; i < instrument.levels; i++) {
    const priceDelta = ((i + 1) * 0.1) + (Math.random() * 0.05);
    const price = basePrice - priceDelta;
    const quantity = Math.floor(Math.random() * 500) + 100;
    
    bids.push({
      price: Number(price.toFixed(2)),
      quantity,
    });
  }
  
  // Generate asks (slightly above base price)
  for (let i = 0; i < instrument.levels; i++) {
    const priceDelta = ((i + 1) * 0.1) + (Math.random() * 0.05);
    const price = basePrice + priceDelta;
    const quantity = Math.floor(Math.random() * 500) + 100;
    
    asks.push({
      price: Number(price.toFixed(2)),
      quantity,
    });
  }
  
  // Sort bids (descending) and asks (ascending)
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);
  
  return { bids, asks };
}

// Update orderbooks periodically
function updateOrderBooks() {
  Object.keys(instruments).forEach(instrumentId => {
    const id = Number(instrumentId);
    const orderbook = generateOrderBook(id);
    
    if (orderbook) {
      orderbooks[id] = orderbook;
      
      // Update depth data for charts
      updateDepthData(id, orderbook.bids, orderbook.asks);
      
      // Update candle history
      const midPrice = getMidPrice(orderbook.bids, orderbook.asks);
      if (midPrice) {
        addCandleToHistory(id, midPrice);
      }
      
      // Send updates to subscribed clients
      sendOrderBookUpdates(id);
    }
  });
}

// Send orderbook updates to subscribed clients
function sendOrderBookUpdates(instrumentId) {
  const orderbook = orderbooks[instrumentId];
  if (!orderbook) return;
  
  // Create update message
  const message = JSON.stringify({
    type: 'orderbook',
    instrumentId,
    symbol: instruments[instrumentId].symbol,
    data: orderbook
  });
  
  // Send to all subscribed clients
  if (subscriptions[instrumentId]) {
    subscriptions[instrumentId].forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe') {
        const { instrumentId } = data;
        
        // Add client to subscription list
        if (!subscriptions[instrumentId]) {
          subscriptions[instrumentId] = new Set();
        }
        subscriptions[instrumentId].add(ws);
        
        console.log(`Client subscribed to ${instruments[instrumentId]?.symbol}`);
        
        // Send initial data
        const orderbook = orderbooks[instrumentId];
        if (orderbook) {
          ws.send(JSON.stringify({
            type: 'orderbook',
            instrumentId,
            symbol: instruments[instrumentId].symbol,
            data: orderbook
          }));
        }
      } 
      else if (data.type === 'unsubscribe') {
        const { instrumentId } = data;
        
        // Remove client from subscription list
        if (subscriptions[instrumentId]) {
          subscriptions[instrumentId].delete(ws);
        }
        
        console.log(`Client unsubscribed from ${instruments[instrumentId]?.symbol}`);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });
  
  // Handle client disconnections
  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Remove from all subscriptions
    Object.values(subscriptions).forEach(clients => {
      clients.delete(ws);
    });
  });
  
  // Send available instruments
  ws.send(JSON.stringify({
    type: 'instruments',
    data: Object.values(instruments)
  }));
});

// REST API endpoints
app.get('/api/instruments', (req, res) => {
  res.json(Object.values(instruments));
});

app.get('/api/orderbook/:instrumentId', (req, res) => {
  const { instrumentId } = req.params;
  const orderbook = orderbooks[instrumentId];
  
  if (!orderbook) {
    return res.status(404).json({ error: 'Instrument not found' });
  }
  
  res.json(orderbook);
});

// Chart data endpoints
app.get('/api/chart/history/:instrumentId', (req, res) => {
  const { instrumentId } = req.params;
  const history = priceHistory[instrumentId];
  
  if (!history) {
    return res.status(404).json({ error: 'Price history not found' });
  }
  
  res.json(history);
});

app.get('/api/chart/depth/:instrumentId', (req, res) => {
  const { instrumentId } = req.params;
  const depth = depthData[instrumentId];
  
  if (!depth) {
    return res.status(404).json({ error: 'Depth data not found' });
  }
  
  res.json(depth);
});

// Initialize orderbooks
updateOrderBooks();

// Update orderbooks every 1-3 seconds
setInterval(() => {
  updateOrderBooks();
}, Math.floor(Math.random() * 2000) + 1000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 