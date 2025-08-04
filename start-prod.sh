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
