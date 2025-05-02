# Market Data Dissemination Simulator

A client-server application demonstrating middleware concepts and distributed asynchronous systems using gRPC for real-time market data streaming.

## Project Overview

This project simulates a market data system where:

1. **Server**: Manages order books for different financial instruments and disseminates market data
2. **Client**: Connects to the server and subscribes to receive real-time market data updates

The communication is implemented using gRPC with bidirectional streaming, allowing clients to:
- Subscribe/unsubscribe to specific instruments
- Receive full order book snapshots upon subscription
- Receive incremental updates to maintain order book state

## Architecture

### Server
- Reads instrument configuration from `appsettings.json`
- Manages order books for each configured instrument
- Simulates market activity (add/replace/remove orders)
- Broadcasts market data to subscribed clients
- Handles client connections and subscription requests

### Client
- Connects to the server via gRPC
- Allows users to subscribe/unsubscribe to instruments
- Displays order book snapshots and incremental updates
- Maintains connection to receive continuous streaming data

## Protocol
- Uses Protocol Buffers for message definition
- Implements bidirectional streaming with gRPC
- Handles two types of updates:
  - **Snapshots**: Complete state of the order book
  - **Incremental Updates**: Changes to apply to the current order book state

## Prerequisites

- .NET 6.0 SDK or higher
- Visual Studio 2022 or another compatible IDE (optional)

## Building the Project

### Using .NET CLI:

```bash
# Clone the repository
git clone https://github.com/yourusername/MarketDataDissemination.git
cd MarketDataDissemination

# Build the solution
dotnet build
```

### Using Visual Studio:

1. Open `MarketDataDissemination.sln` in Visual Studio
2. Build the solution (Ctrl+Shift+B)

## Running the Application

You'll need to run both the server and client applications simultaneously:

### Server:

```bash
cd Server/bin/Debug/net6.0
./Server
```

or

```bash
dotnet run --project Server
```

### Client:

```bash
cd Client/bin/Debug/net6.0
./Client
```

or

```bash
dotnet run --project Client
```

## Usage

After starting both applications:

1. In the client console, use the following commands:
   - `sub 1` - Subscribe to instrument with ID 1
   - `sub 2` - Subscribe to instrument with ID 2
   - `unsub 1` - Unsubscribe from instrument with ID 1
   - `quit` - Exit the application

2. You'll see real-time order book updates in the client console:
   - Snapshots when subscribing to an instrument
   - Incremental updates as the market changes
   - Empty snapshots when unsubscribing

## Project Extension Ideas

As mentioned in the original video, there are several ways to extend this project:

1. **Build a Frontend UI**:
   - Create a web-based or desktop UI that visualizes the order book
   - Display bid/ask prices and quantities in a user-friendly format
   - Show cumulative size at each price level
   - Implement real-time visualization with colors indicating changes

2. **Data Persistence Service**:
   - Create a separate service that subscribes to all instruments
   - Persist market data updates to a database
   - Options include Cassandra, MongoDB, SQL Server, or specialized time-series databases
   - Implement efficient storage patterns for high-frequency data

3. **Enhanced Server Features**:
   - Add more realistic market simulation logic
   - Implement latency controls to simulate network conditions
   - Add authentication and authorization for client connections
   - Implement rate limiting for client subscriptions

4. **Performance Testing**:
   - Create a load testing client to simulate hundreds of connections
   - Measure and optimize throughput and latency
   - Implement metrics collection and monitoring

5. **Additional Middleware Features**:
   - Implement a message broker (RabbitMQ, Kafka) as an alternative to gRPC
   - Compare performance characteristics between different middleware options
   - Add circuit breaker patterns for fault tolerance

## Project Structure Explanation

The project is organized as follows:

```
MarketDataDissemination/
├── Server/                   # Server application
│   ├── appsettings.json      # Instrument configuration
│   ├── Program.cs            # Application entry point
│   ├── Server.cs             # Main server class
│   ├── OrderbookManager.cs   # Manages orderbook state
│   ├── Orderbook.cs          # Orderbook implementation
│   ├── OrderbookService.cs   # gRPC service implementation
│   ├── ServerClient.cs       # Client connection handler
│   ├── ServerConfiguration.cs # Configuration models
│   └── DomainModels.cs       # Domain model classes
├── Client/                   # Client application
│   ├── Program.cs            # Application entry point
│   ├── Client.cs             # gRPC client implementation
│   └── DomainModels.cs       # Client-side domain models
└── Shared/                   # Shared code between projects
    └── Proto/                # Protocol buffer definitions
        └── orderbook.proto   # gRPC service definition
```

## Key Technical Concepts Demonstrated

1. **Client-Server Architecture**:
   - Clear separation of responsibilities
   - Bidirectional communication

2. **Middleware Understanding**:
   - gRPC for service definition and communication
   - Protocol Buffers for message serialization
   - Streaming APIs for real-time data

3. **Distributed Systems Patterns**:
   - Snapshot and incremental update pattern
   - Subscription-based data dissemination
   - Asynchronous communication

4. **Concurrency and Threading**:
   - Task-based asynchronous programming
   - Thread-safety with locks
   - Cancelable operations

5. **Real-world Market Data Concepts**:
   - Order book management
   - Bid/ask price levels
   - Trade simulation

## Learning Outcomes

Building this project helps demonstrate understanding of:

1. How to design and implement cross-service communication
2. Real-time data streaming architecture patterns
3. Distributed system design and implementation
4. Market data structures and dissemination techniques
5. Concurrent programming and thread safety
6. Modern C# and .NET programming practices

This project serves as a foundation that can be extended with additional features to demonstrate more advanced concepts in distributed systems and financial technology.