@echo off
echo Cleaning up build artifacts and generated files...

echo Removing .NET build artifacts...
rmdir /s /q bin 2>nul
rmdir /s /q obj 2>nul

echo Removing node_modules...
rmdir /s /q api\node_modules 2>nul
rmdir /s /q frontend\node_modules 2>nul
rmdir /s /q node_modules 2>nul

echo Removing next.js artifacts...
rmdir /s /q frontend\.next 2>nul

echo Removing macOS helper scripts...
del /q *.command 2>nul

echo Cleanup complete!
echo.
echo Note: To restore dependencies, you'll need to run:
echo   dotnet restore
echo   cd api ^&^& npm install
echo   cd frontend ^&^& npm install 