@echo off
echo Starting Server and Client applications...

start cmd.exe /k "cd /d %~dp0 && dotnet run --project Server"
timeout /t 5
start cmd.exe /k "cd /d %~dp0 && dotnet run --project Client"

echo Both applications should now be running in separate windows. 