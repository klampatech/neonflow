#!/bin/bash

# NEONFLOW Quick Start Script
# Starts a local server and opens the app in your browser

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting NEONFLOW..."

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found in current directory"
    exit 1
fi

# Kill any existing server on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start local server in background
echo "📡 Starting local server on http://localhost:8080"
python3 -m http.server 8080 --directory "$SCRIPT_DIR" > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 1

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:8080
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8080
    elif command -v gnome-open &> /dev/null; then
        gnome-open http://localhost:8080
    fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash / WSL)
    start http://localhost:8080
else
    echo "⚠️ Unknown OS. Please open http://localhost:8080 manually."
fi

echo ""
echo "✅ NEONFLOW is running at http://localhost:8080"
echo ""
echo "💡 Tips:"
echo "   - Press ⌘/Ctrl+N to create a new task"
echo "   - Press ? to see all keyboard shortcuts"
echo ""
echo "🛑 To stop the server, run: kill $SERVER_PID"
echo ""