const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// In-memory storage for orderbook data
const orderbooks = {
  1: { // AAPL
    bids: [],
    asks: []
  },
  2: { // MSFT
    bids: [],
    asks: []
  }
};

// Subscribed instruments
const subscriptions = new Set();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  // Send initial orderbook state for all subscribed instruments
  for (const instrumentId of subscriptions) {
    ws.send(JSON.stringify({
      type: 'snapshot',
      instrumentId,
      data: orderbooks[instrumentId]
    }));
  }
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.action === 'subscribe') {
        // Simulate subscribing to an instrument
        subscribeToInstrument(data.instrumentId);
        // Send current state immediately
        ws.send(JSON.stringify({
          type: 'snapshot',
          instrumentId: data.instrumentId,
          data: orderbooks[data.instrumentId]
        }));
      } else if (data.action === 'unsubscribe') {
        unsubscribeFromInstrument(data.instrumentId);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Function to subscribe to an instrument
function subscribeToInstrument(instrumentId) {
  if (!subscriptions.has(instrumentId)) {
    console.log(`Subscribing to instrument ${instrumentId}`);
    subscriptions.add(instrumentId);
    
    // Simulate initial snapshot
    generateRandomOrderbook(instrumentId);
    
    // Broadcast to all clients
    broadcastUpdate('snapshot', instrumentId);
    
    // Start sending periodic updates for this instrument
    setInterval(() => {
      // 70% chance for incremental update, 30% chance for snapshot
      const updateType = Math.random() > 0.7 ? 'snapshot' : 'incremental';
      
      if (updateType === 'snapshot') {
        generateRandomOrderbook(instrumentId);
      } else {
        updateRandomLevel(instrumentId);
      }
      
      broadcastUpdate(updateType, instrumentId);
    }, 1000 + Math.random() * 2000); // Random interval between 1-3 seconds
  }
}

// Function to unsubscribe from an instrument
function unsubscribeFromInstrument(instrumentId) {
  if (subscriptions.has(instrumentId)) {
    console.log(`Unsubscribing from instrument ${instrumentId}`);
    subscriptions.delete(instrumentId);
    
    // Clear orderbook data
    orderbooks[instrumentId].bids = [];
    orderbooks[instrumentId].asks = [];
    
    // Broadcast empty snapshot to all clients
    broadcastUpdate('snapshot', instrumentId);
  }
}

// Function to broadcast updates to all connected clients
function broadcastUpdate(type, instrumentId) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type,
        instrumentId,
        data: orderbooks[instrumentId]
      }));
    }
  });
}

// Function to generate a random orderbook
function generateRandomOrderbook(instrumentId) {
  const maxLevels = instrumentId === 1 ? 10 : 5; // AAPL: 10 levels, MSFT: 5 levels
  
  orderbooks[instrumentId] = {
    bids: [],
    asks: []
  };
  
  // Generate random bid levels (sorted descending by price)
  const baseBidPrice = 100 + Math.random() * 50;
  for (let i = 0; i < Math.floor(Math.random() * maxLevels) + 1; i++) {
    orderbooks[instrumentId].bids.push({
      price: baseBidPrice - (i * (0.5 + Math.random())),
      quantity: Math.floor(Math.random() * 1000) + 100,
      isBuy: true
    });
  }
  
  // Sort bids in descending order
  orderbooks[instrumentId].bids.sort((a, b) => b.price - a.price);
  
  // Generate random ask levels (sorted ascending by price)
  const baseAskPrice = baseBidPrice + (1 + Math.random() * 2);
  for (let i = 0; i < Math.floor(Math.random() * maxLevels) + 1; i++) {
    orderbooks[instrumentId].asks.push({
      price: baseAskPrice + (i * (0.5 + Math.random())),
      quantity: Math.floor(Math.random() * 1000) + 100,
      isBuy: false
    });
  }
  
  // Sort asks in ascending order
  orderbooks[instrumentId].asks.sort((a, b) => a.price - b.price);
}

// Function to update a random level in the orderbook
function updateRandomLevel(instrumentId) {
  const orderbook = orderbooks[instrumentId];
  const side = Math.random() > 0.5 ? 'bids' : 'asks';
  const levels = orderbook[side];
  
  if (levels.length === 0) {
    // If no levels exist, add a new one
    const newPrice = side === 'bids' 
      ? 100 + Math.random() * 50 
      : 100 + Math.random() * 50 + (1 + Math.random() * 2);
    
    levels.push({
      price: newPrice,
      quantity: Math.floor(Math.random() * 1000) + 100,
      isBuy: side === 'bids'
    });
  } else {
    // Choose a random action: add, remove, or replace
    const action = Math.random();
    
    if (action < 0.4 && levels.length > 1) {
      // Remove a random level
      const indexToRemove = Math.floor(Math.random() * levels.length);
      levels.splice(indexToRemove, 1);
    } else if (action < 0.7) {
      // Replace a random level's quantity
      const indexToReplace = Math.floor(Math.random() * levels.length);
      levels[indexToReplace].quantity = Math.floor(Math.random() * 1000) + 100;
    } else {
      // Add a new level
      const maxLevels = instrumentId === 1 ? 10 : 5;
      
      if (levels.length < maxLevels) {
        const lastPrice = levels[levels.length - 1].price;
        const newPrice = side === 'bids'
          ? lastPrice - (0.5 + Math.random())
          : lastPrice + (0.5 + Math.random());
        
        levels.push({
          price: newPrice,
          quantity: Math.floor(Math.random() * 1000) + 100,
          isBuy: side === 'bids'
        });
        
        // Re-sort the levels
        if (side === 'bids') {
          levels.sort((a, b) => b.price - a.price);
        } else {
          levels.sort((a, b) => a.price - b.price);
        }
      }
    }
  }
}

// REST API routes
app.get('/api/instruments', (req, res) => {
  res.json([
    { id: 1, symbol: 'AAPL', specifications: { depth: 10 } },
    { id: 2, symbol: 'MSFT', specifications: { depth: 5 } }
  ]);
});

app.get('/api/orderbook/:instrumentId', (req, res) => {
  const instrumentId = parseInt(req.params.instrumentId);
  if (orderbooks[instrumentId]) {
    res.json(orderbooks[instrumentId]);
  } else {
    res.status(404).json({ error: 'Instrument not found' });
  }
});

// Start server
server.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
}); 