# Market Data Dissemination Simulator - Architecture Diagram

```
┌─────────────────┐       ┌───────────────────┐      ┌────────────────┐
│                 │       │                   │      │                │
│  C# gRPC Server │◄─────►│   C# Console      │      │                │
│  (Orderbooks)   │       │   Client          │      │                │
│                 │       │                   │      │                │
└────────┬────────┘       └───────────────────┘      │                │
         │                                           │                │
         │                                           │                │
         │ gRPC                                      │                │
         │                                           │                │
┌────────▼────────┐       ┌───────────────────┐      │                │
│                 │       │                   │      │                │
│  Node.js API    │◄─────►│   Next.js         │◄─────►  Web Browser   │
│  Server         │       │   Frontend        │      │                │
│                 │       │                   │      │                │
└─────────────────┘       └───────────────────┘      └────────────────┘
     WebSocket                   HTTP/JS
     
```

## Communication Flow

1. **C# gRPC Server** simulates market activity and manages orderbooks
2. **C# Console Client** connects via gRPC to receive market data
3. **Node.js API Server** provides WebSocket API for real-time data
4. **Next.js Frontend** connects to API server and visualizes orderbooks
5. **Web Browser** displays the UI to end users

## Data Flow

1. Server generates market data (snapshots and incremental updates)
2. Console client receives this data via gRPC
3. API server simulates this data and exposes it via WebSockets 
4. Frontend connects to API server via WebSockets to receive data
5. Frontend renders the data in a user-friendly interface

## Technologies

- **Backend**: C#, .NET 9.0, gRPC, Protocol Buffers
- **Middleware**: Node.js, Express, WebSockets
- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion
- **Data Transfer**: JSON over WebSockets, Protocol Buffers over gRPC 