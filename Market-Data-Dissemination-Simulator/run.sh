#!/bin/bash

echo "Starting all components of Market Data Dissemination Simulator..."

# Start C# Server
echo "Starting C# Server..."
gnome-terminal -- bash -c "cd \"$(pwd)\" && dotnet run --project Server; exec bash" || \
    xterm -e "cd \"$(pwd)\" && dotnet run --project Server" || \
    open -a Terminal.app "$(pwd)/server_start.command" || \
    konsole --workdir "$(pwd)" -e "dotnet run --project Server" || \
    bash -c "cd \"$(pwd)\" && dotnet run --project Server" &

# Give server time to start
sleep 5

# Start C# Client
echo "Starting C# Client..."
gnome-terminal -- bash -c "cd \"$(pwd)\" && dotnet run --project Client; exec bash" || \
    xterm -e "cd \"$(pwd)\" && dotnet run --project Client" || \
    open -a Terminal.app "$(pwd)/client_start.command" || \
    konsole --workdir "$(pwd)" -e "dotnet run --project Client" || \
    bash -c "cd \"$(pwd)\" && dotnet run --project Client" &

# Start Node.js API Server
echo "Starting Node.js API Server..."
gnome-terminal -- bash -c "cd \"$(pwd)/api\" && node index.js; exec bash" || \
    xterm -e "cd \"$(pwd)/api\" && node index.js" || \
    open -a Terminal.app "$(pwd)/api_start.command" || \
    konsole --workdir "$(pwd)/api" -e "node index.js" || \
    bash -c "cd \"$(pwd)/api\" && node index.js" &

# Give API server time to start
sleep 3

# Start Next.js Frontend
echo "Starting Next.js Frontend..."
gnome-terminal -- bash -c "cd \"$(pwd)/frontend\" && npm run dev; exec bash" || \
    xterm -e "cd \"$(pwd)/frontend\" && npm run dev" || \
    open -a Terminal.app "$(pwd)/frontend_start.command" || \
    konsole --workdir "$(pwd)/frontend" -e "npm run dev" || \
    bash -c "cd \"$(pwd)/frontend\" && npm run dev" &

# Create helper scripts for macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo '#!/bin/bash
cd "$(dirname "$0")" && dotnet run --project Server' > server_start.command
    echo '#!/bin/bash
cd "$(dirname "$0")" && dotnet run --project Client' > client_start.command
    echo '#!/bin/bash
cd "$(dirname "$0")/api" && node index.js' > api_start.command
    echo '#!/bin/bash
cd "$(dirname "$0")/frontend" && npm run dev' > frontend_start.command
    chmod +x server_start.command client_start.command api_start.command frontend_start.command
fi

echo "All components should now be running in separate windows."
echo "- Server: C# gRPC Server (orderbooks)"
echo "- Client: C# Console Client"
echo "- API: Node.js WebSocket Server"
echo "- Frontend: Next.js web interface at http://localhost:3000" 