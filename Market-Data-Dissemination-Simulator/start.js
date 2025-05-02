#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Get the current directory
const rootDir = __dirname;

console.log('Starting all components of Market Data Dissemination Simulator...');

// Helper function to create colored console output
const colors = {
  server: '\x1b[36m', // Cyan
  client: '\x1b[32m', // Green
  api: '\x1b[33m',    // Yellow
  frontend: '\x1b[35m', // Magenta
  reset: '\x1b[0m'    // Reset
};

// Helper function to run a process and handle its output
function runProcess(name, command, args, cwd, colorCode) {
  console.log(`Starting ${name}...`);
  
  const isWindows = os.platform() === 'win32';
  let proc;
  
  if (isWindows) {
    proc = spawn(command, args, { 
      cwd, 
      shell: true,
      stdio: 'pipe'
    });
  } else {
    proc = spawn(command, args, { 
      cwd,
      stdio: 'pipe'
    });
  }
  
  proc.stdout.on('data', (data) => {
    console.log(`${colorCode}[${name}] ${data.toString().trim()}${colors.reset}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`${colorCode}[${name} ERROR] ${data.toString().trim()}${colors.reset}`);
  });
  
  proc.on('close', (code) => {
    console.log(`${colorCode}[${name}] Process exited with code ${code}${colors.reset}`);
  });
  
  return proc;
}

// Start C# Server
const serverProc = runProcess(
  'Server',
  'dotnet',
  ['run', '--project', 'Server'],
  rootDir,
  colors.server
);

// Wait for the server to start
setTimeout(() => {
  // Start C# Client
  const clientProc = runProcess(
    'Client',
    'dotnet',
    ['run', '--project', 'Client'],
    rootDir,
    colors.client
  );
  
  // Start Node.js API Server
  const apiProc = runProcess(
    'API Server',
    'node',
    ['index.js'],
    path.join(rootDir, 'api'),
    colors.api
  );
  
  // Wait for the API server to start
  setTimeout(() => {
    // Start Next.js Frontend
    const frontendProc = runProcess(
      'Frontend',
      os.platform() === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'dev'],
      path.join(rootDir, 'frontend'),
      colors.frontend
    );
    
    console.log('\nAll components are now running:');
    console.log(`${colors.server}- Server: C# gRPC Server (orderbooks)${colors.reset}`);
    console.log(`${colors.client}- Client: C# Console Client${colors.reset}`);
    console.log(`${colors.api}- API: Node.js WebSocket Server${colors.reset}`);
    console.log(`${colors.frontend}- Frontend: Next.js web interface at http://localhost:3000${colors.reset}`);
    console.log('\nPress Ctrl+C to stop all processes');
    
    // Handle clean shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down all processes...');
      serverProc.kill();
      clientProc.kill();
      apiProc.kill();
      frontendProc.kill();
      process.exit(0);
    });
    
  }, 3000); // Wait 3 seconds for API server to start
  
}, 5000); // Wait 5 seconds for C# server to start 