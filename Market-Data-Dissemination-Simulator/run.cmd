@echo off
echo Starting all components of Market Data Dissemination Simulator...

echo Starting C# Server...
start cmd.exe /k "cd /d %~dp0 && dotnet run --project Server"
timeout /t 5

echo Starting C# Client...
start cmd.exe /k "cd /d %~dp0 && dotnet run --project Client"

echo Starting Node.js API Server...
start cmd.exe /k "cd /d %~dp0\api && node index.js"
timeout /t 3

echo Starting Next.js Frontend...
start cmd.exe /k "cd /d %~dp0\frontend && npm run dev"

echo All components should now be running in separate windows.
echo - Server: C# gRPC Server (orderbooks)
echo - Client: C# Console Client
echo - API: Node.js WebSocket Server
echo - Frontend: Next.js web interface at http://localhost:3000 