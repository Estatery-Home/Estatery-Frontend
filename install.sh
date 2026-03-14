#!/bin/sh
echo "Installing Estatery Frontend dependencies..."
echo ""
echo "[1/2] Installing admin app (estatery/admin)..."
cd estatery/admin && npm install || exit 1
cd ../..
echo ""
echo "[2/2] Installing website (estatery/customer)..."
cd estatery/customer && npm install || exit 1
cd ..
echo ""
echo "Dependencies installed successfully."
echo "  - Admin: npm run dev:admin"
echo "  - Website: npm run dev:website"
