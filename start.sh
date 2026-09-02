#!/bin/bash
# IndieGamer Hub - Start all services

echo "🎮 Starting IndieGamer Hub..."

# Start MongoDB if not running
if ! brew services list | grep mongodb-community | grep -q started; then
  echo "▶ Starting MongoDB..."
  brew services start mongodb-community
  sleep 2
fi

# Start backend server
echo "▶ Starting backend server on :5001..."
cd "$(dirname "$0")/server" && npm run dev &

# Start frontend dev server
echo "▶ Starting frontend on :5173..."
cd "$(dirname "$0")/client" && npm run dev &

echo "✅ All services started!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5001"
wait
