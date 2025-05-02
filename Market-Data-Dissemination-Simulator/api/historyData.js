// Storage for historical price data
const priceHistory = {
  1: [], // AAPL
  2: [], // MSFT
};

// Storage for depth chart data (cumulative volumes)
const depthData = {
  1: { bids: [], asks: [] }, // AAPL
  2: { bids: [], asks: [] }, // MSFT
};

// Generate initial candle data
function initializePriceHistory(instrumentId) {
  const history = [];
  const basePrice = instrumentId === 1 ? 150 : 350; // AAPL starts ~150, MSFT ~350
  const volatility = instrumentId === 1 ? 2 : 3;
  
  // Generate 100 candles with 1-minute intervals (going back from now)
  const now = new Date();
  now.setSeconds(0, 0); // Reset seconds and milliseconds
  
  for (let i = 100; i >= 0; i--) {
    const time = new Date(now);
    time.setMinutes(now.getMinutes() - i);
    
    const randomFactor = (Math.random() - 0.5) * volatility;
    const open = basePrice + randomFactor;
    const high = open + (Math.random() * volatility);
    const low = open - (Math.random() * volatility);
    const close = (high + low) / 2 + (Math.random() - 0.5) * volatility;
    const volume = Math.floor(Math.random() * 10000) + 1000;
    
    history.push({
      time: Math.floor(time.getTime() / 1000), // Unix timestamp in seconds
      open,
      high,
      close,
      low,
      volume
    });
  }
  
  priceHistory[instrumentId] = history;
}

// Add a new candle to the history
function addCandleToHistory(instrumentId, price) {
  const history = priceHistory[instrumentId];
  if (!history || history.length === 0) {
    initializePriceHistory(instrumentId);
    return;
  }
  
  const lastCandle = history[history.length - 1];
  const now = new Date();
  now.setSeconds(0, 0); // Reset seconds and milliseconds
  const currentMinute = Math.floor(now.getTime() / 1000);
  
  // If the last candle is from the current minute, update it
  if (lastCandle.time === currentMinute) {
    lastCandle.close = price;
    lastCandle.high = Math.max(lastCandle.high, price);
    lastCandle.low = Math.min(lastCandle.low, price);
    lastCandle.volume += Math.floor(Math.random() * 100);
  } else {
    // Create a new candle
    const newCandle = {
      time: currentMinute,
      open: lastCandle.close,
      high: Math.max(lastCandle.close, price),
      low: Math.min(lastCandle.close, price),
      close: price,
      volume: Math.floor(Math.random() * 500) + 100
    };
    
    // Add the new candle and limit history to 100 candles
    history.push(newCandle);
    if (history.length > 100) {
      history.shift();
    }
  }
}

// Update depth data based on current orderbook
function updateDepthData(instrumentId, bids, asks) {
  if (!depthData[instrumentId]) {
    depthData[instrumentId] = { bids: [], asks: [] };
  }
  
  // Calculate cumulative volumes
  const bidDepth = [];
  const askDepth = [];
  
  let cumulativeBidVolume = 0;
  let cumulativeAskVolume = 0;
  
  // Sort bids (descending) and asks (ascending)
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
  
  // Calculate cumulative bids
  for (const bid of sortedBids) {
    cumulativeBidVolume += bid.quantity;
    bidDepth.push({
      price: bid.price,
      volume: cumulativeBidVolume
    });
  }
  
  // Calculate cumulative asks
  for (const ask of sortedAsks) {
    cumulativeAskVolume += ask.quantity;
    askDepth.push({
      price: ask.price,
      volume: cumulativeAskVolume
    });
  }
  
  depthData[instrumentId] = { bids: bidDepth, asks: askDepth };
}

// Get mid price from bids and asks
function getMidPrice(bids, asks) {
  if (!bids.length || !asks.length) return null;
  
  // Find the highest bid and lowest ask
  const highestBid = Math.max(...bids.map(b => b.price));
  const lowestAsk = Math.min(...asks.map(a => a.price));
  
  return (highestBid + lowestAsk) / 2;
}

// Initialize the history for all instruments
initializePriceHistory(1); // AAPL
initializePriceHistory(2); // MSFT

module.exports = {
  priceHistory,
  depthData,
  addCandleToHistory,
  updateDepthData,
  getMidPrice
}; 