@echo off
echo Installing Estatery Frontend dependencies...
echo.
echo [1/2] Installing admin app (estatery)...
cd estatery
call npm install
if %errorlevel% neq 0 (
  echo Installation failed.
  exit /b 1
)
cd ..
echo.
echo [2/2] Installing website (Estatery-website)...
cd Estatery-website
call npm install
if %errorlevel% neq 0 (
  echo Installation failed.
  exit /b 1
)
cd ..
echo.
echo Dependencies installed successfully.
echo   - Admin: npm run dev:admin
echo   - Website: npm run dev:website
