#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');

const port = 3000;
const isWindows = os.platform() === 'win32';

function killPortAndStartDev() {
  let killCommand;

  if (isWindows) {
    killCommand = `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F 2>nul`;
  } else {
    killCommand = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
  }

  console.log(`🔥 Killing any process on port ${port}...`);

  exec(killCommand, (killError) => {
    if (killError && !isWindows) {
      console.log('ℹ️  No process found on port (or already killed)');
    }

    setTimeout(() => {
      console.log('✨ Starting Next.js dev server...\n');
      exec('next dev', (error, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        if (error) process.exit(error.code || 1);
      });
    }, 500);
  });
}

killPortAndStartDev();
