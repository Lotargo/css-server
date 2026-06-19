@echo off
chcp 65001 >nul
echo ==================================================
echo Starting CSS-Server (Glass Calculator)
echo ==================================================

:: Check node_modules
if not exist "node_modules\" (
    echo Installing node dependencies...
    call npm install
)

:: Compile CSS
echo Compiling modular Sass stylesheets...
call npm run build:css

:: Launch Dev server
echo Launching CSS-Server dev environment...
node scripts\dev.mjs
