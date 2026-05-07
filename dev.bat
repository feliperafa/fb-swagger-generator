@echo off
echo 🔥 Killing any process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F 2>nul

timeout /t 1 /nobreak >nul

echo ✨ Starting Next.js dev server...
npm run dev
