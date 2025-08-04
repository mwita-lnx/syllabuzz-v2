#!/bin/bash

# Start all services for development
echo "🚀 Starting SyllaBuzz in development mode..."

# Function to run command in new terminal (works with gnome-terminal, xterm, etc.)
run_in_terminal() {
    local title=$1
    local command=$2
    local directory=$3
    
    if command -v gnome-terminal >/dev/null 2>&1; then
        gnome-terminal --title="$title" --working-directory="$directory" -- bash -c "$command; exec bash"
    elif command -v xterm >/dev/null 2>&1; then
        xterm -title "$title" -e "cd $directory && $command; bash" &
    else
        echo "Starting $title in background..."
        cd "$directory" && $command &
        cd - > /dev/null
    fi
}

# Start Python server
run_in_terminal "Python Server" "source venv/bin/activate && python run.py" "$(pwd)/server"

# Start Node.js backend
run_in_terminal "Node.js Backend" "npm run dev" "$(pwd)/backend"

# Start React frontend
run_in_terminal "React Frontend" "npm run dev" "$(pwd)/client"

echo "✅ All services started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo "🐍 Python Server: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user input to stop
read -p "Press Enter to stop all services..."

# Kill all background processes
pkill -f "npm run dev"
pkill -f "python run.py"
pkill -f "vite"

echo "👋 All services stopped"
