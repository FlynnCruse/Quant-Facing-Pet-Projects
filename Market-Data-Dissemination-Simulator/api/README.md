# Market Data Dissemination Simulator API

This is a Node.js API server that simulates market data dissemination for the Market Data Dissemination Simulator project. It provides both REST endpoints and WebSocket connections for real-time orderbook data.

## Features

- WebSocket server for real-time market data
- Subscribe/unsubscribe to instruments
- REST API endpoints for instrument information
- Simulates orderbook updates similar to the C# server

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the API server:

```bash
npm start
```

The server will start on port 3001.

## API Endpoints

### REST Endpoints

- `GET /api/instruments` - Get all available instruments
- `GET /api/orderbook/:instrumentId` - Get current state of an orderbook

### WebSocket Protocol

Connect to the WebSocket server at `ws://localhost:3001`

Messages from client to server:
```json
{
  "action": "subscribe",
  "instrumentId": 1
}
```

```json
{
  "action": "unsubscribe",
  "instrumentId": 1
}
```

Messages from server to client:
```json
{
  "type": "snapshot",
  "instrumentId": 1,
  "data": {
    "bids": [...],
    "asks": [...]
  }
}
```

```json
{
  "type": "incremental",
  "instrumentId": 1,
  "data": {
    "bids": [...],
    "asks": [...]
  }
}
```

## Dependencies

- Express - Web server framework
- ws - WebSocket implementation
- cors - Cross-origin resource sharing
- axios - HTTP client

## Usage with Frontend

This API server is designed to work with the Next.js frontend located in the `frontend` directory. 