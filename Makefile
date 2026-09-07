.PHONY: help install dev build clean docker-build docker-up docker-down logs

help:
	@echo "IndieGamerHub - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install          - Install dependencies for both client and server"
	@echo "  make dev              - Run both client and server in development mode"
	@echo "  make dev-server       - Run only server in development mode"
	@echo "  make dev-client       - Run only client in development mode"
	@echo ""
	@echo "Production:"
	@echo "  make build            - Build client for production"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-up        - Start services with Docker Compose"
	@echo "  make docker-down      - Stop services with Docker Compose"
	@echo "  make logs             - View Docker Compose logs"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean            - Remove node_modules and build artifacts"
	@echo "  make lint             - Run linter on client"
	@echo ""

install:
	cd server && npm install
	cd client && npm install

dev:
	@echo "Starting development environment..."
	@echo "Server running on http://localhost:5000"
	@echo "Client running on http://localhost:5173"
	@(cd server && npm run dev) & (cd client && npm run dev)

dev-server:
	cd server && npm run dev

dev-client:
	cd client && npm run dev

build:
	cd client && npm run build

clean:
	rm -rf server/node_modules client/node_modules
	rm -rf client/dist
	rm -rf node_modules

lint:
	cd client && npm run lint

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

logs:
	docker-compose logs -f

.DEFAULT_GOAL := help
