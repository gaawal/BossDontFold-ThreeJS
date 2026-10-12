@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo 请安装 Node.js 22.12 或更高版本，然后重新运行。
 pause
 exit /b 1
)
start "" http://localhost:8080
node scripts/serve.mjs
pause
