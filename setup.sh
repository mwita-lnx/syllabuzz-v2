#!/bin/bash

# SyllaBuzz Project Setup Script
# This script sets up the development environment for SyllaBuzz

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Welcome message
echo "================================================"
echo "🚀 SyllaBuzz Project Setup"
echo "================================================"
echo ""

# Check system requirements
print_status "Checking system requirements..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python found: $PYTHON_VERSION"
else
    print_error "Python 3 is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
fi

# Check pip
if command_exists pip3; then
    PIP_VERSION=$(pip3 --version)
    print_success "pip found: $PIP_VERSION"
else
    print_error "pip3 is not installed. Please install pip3."
    exit 1
fi

# Check Docker (optional but recommended)
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker found: $DOCKER_VERSION"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker is not installed. Some features may not work without Docker."
    DOCKER_AVAILABLE=false
fi

# Check MongoDB
if command_exists mongod; then
    print_success "MongoDB found"
    MONGODB_LOCAL=true
else
    print_warning "MongoDB is not installed locally. You can use Docker or install MongoDB manually."
    MONGODB_LOCAL=false
fi

# Check Redis
if command_exists redis-server; then
    print_success "Redis found"
    REDIS_LOCAL=true
else
    print_warning "Redis is not installed locally. You can use Docker or install Redis manually."
    REDIS_LOCAL=false
fi

echo ""

# Setup environment variables
print_status "Setting up environment variables..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please edit .env file with your configuration"
    else
        print_error ".env.example file not found"
        exit 1
    fi
else
    print_success ".env file already exists"
fi

echo ""

# Install dependencies
print_status "Installing dependencies..."

# Frontend dependencies
print_status "Installing frontend dependencies..."
cd client
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Backend dependencies
print_status "Installing backend dependencies..."
cd backend
if npm install; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Python server dependencies
print_status "Installing Python server dependencies..."
cd server

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment and install dependencies
print_status "Installing Python dependencies..."
source venv/bin/activate
if pip install -r requirements.txt; then
    print_success "Python dependencies installed"
else
    print_error "Failed to install Python dependencies"
    exit 1
fi
deactivate
cd ..

echo ""o

# Setup databases
print_status "Setting up databases..."

if [ "$DOCKER_AVAILABLE" = true ]; then
    print_status "Starting databases with Docker..."
    
    # Check if docker-compose is available
    if command_exists docker-compose; then
        COMPOSE_CMD="docker-compose"
    elif command_exists docker && docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose is not available"
        exit 1
    fi
    
    # Start only database services
    if $COMPOSE_CMD up -d mongo qdrant; then
        print_success "Database services started with Docker"
    else
        print_error "Failed to start database services"
        exit 1
    fi
    
    # Wait for services to be ready
    print_status "Waiting for databases to be ready..."
    sleep 10
    
else
    if [ "$MONGODB_LOCAL" = false ]; then
        print_error "MongoDB is required but not available. Please install MongoDB or Docker."
        exit 1
    fi
    
    print_warning "Starting local MongoDB (if not already running)..."
    # Try to start MongoDB (this may fail if it's already running, which is fine)
    sudo systemctl start mongod 2>/dev/null || true
fi

echo ""

# Check port availability
print_status "Checking port availability..."

PORTS_TO_CHECK=(3000 3001 3002 5000 5173 6333 27017)
PORTS_IN_USE=()

for port in "${PORTS_TO_CHECK[@]}"; do
    if ! check_port $port; then
        PORTS_IN_USE+=($port)
    fi
done

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    print_warning "The following ports are in use: ${PORTS_IN_USE[*]}"
    print_warning "You may need to stop other services or change port configuration"
fi

echo ""

# Setup database indexes
print_status "Setting up database indexes..."
cd server
source venv/bin/activate
if python -c "
from app import create_app
from app.utils.database import create_indexes
app = create_app()
with app.app_context():
    create_indexes()
    print('Database indexes created successfully')
"; then
    print_success "Database indexes created"
else
    print_warning "Failed to create database indexes (database may not be ready)"
fi
deactivate
cd ..

echo ""

# Create startup scripts
print_status "Creating startup scripts..."

# Development startup script
cat > start-dev.sh << 'EOF'
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
EOF

chmod +x start-dev.sh

# Production startup script
cat > start-prod.sh << 'EOF'
#!/bin/bash

# Start all services for production using Docker
echo "🚀 Starting SyllaBuzz in production mode..."

# Check if docker-compose is available
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose is not available"
    exit 1
fi

# Build and start all services
if $COMPOSE_CMD up -d --build; then
    echo "✅ All services started successfully!"
    echo "🌐 Application: http://localhost:3000"
    echo ""
    echo "To view logs: $COMPOSE_CMD logs -f"
    echo "To stop: $COMPOSE_CMD down"
else
    echo "❌ Failed to start services"
    exit 1
fi
EOF

chmod +x start-prod.sh

print_success "Startup scripts created (start-dev.sh and start-prod.sh)"

echo ""

# Final instructions
print_success "🎉 Setup completed successfully!"
echo ""
echo "================================================"
echo "📝 Next Steps:"
echo "================================================"
echo ""
echo "1. 📝 Edit .env file with your configuration:"
echo "   - Set JWT_SECRET to a secure random string"
echo "   - Configure database URLs if needed"
echo "   - Set email credentials for password reset"
echo ""
echo "2. 🚀 Start the development environment:"
echo "   ./start-dev.sh"
echo ""
echo "3. 🔗 Access the application:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:3000"
echo "   - Python Server: http://localhost:5000"
echo ""
echo "4. 🐳 For production deployment:"
echo "   ./start-prod.sh"
echo ""
echo "================================================"
echo "📚 Additional Information:"
echo "================================================"
echo ""
echo "• Configuration files:"
echo "  - .env (environment variables)"
echo "  - docker-compose.yml (Docker services)"
echo ""
echo "• Useful commands:"
echo "  - npm run lint (check code style)"
echo "  - npm run build (build for production)"
echo "  - docker-compose logs -f (view logs)"
echo ""
echo "• Documentation:"
echo "  - See README.md for detailed information"
echo "  - Check API endpoints in server/app/routes/"
echo ""

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    echo "⚠️  Warning: Some ports are in use: ${PORTS_IN_USE[*]}"
    echo "   You may need to stop other services first"
    echo ""
fi

print_success "Happy coding! 🎉"