# CodLabStudio - Setup Guide

## Prerequisites

- Docker and Docker Compose (required)
- Node.js 20+ and npm 10+ (optional - only needed for local development without Docker)
- Git (optional)

**Note**: If you're setting up on a NAS or system without Node.js/npm, Docker Compose will handle everything. See [NAS_SETUP.md](./NAS_SETUP.md) for NAS-specific instructions.

## Initial Setup

### Option A: Docker Compose (Recommended - No npm needed)

If you don't have Node.js/npm installed, Docker will handle everything:

```bash
# 1. Create .env file (see .env.example)
cp .env.example .env
# Edit .env with your configuration

# 2. Start all services
docker compose up -d --build

# 3. Initialize database
docker compose exec backend npm run db:generate
docker compose exec backend npm run db:migrate

# 4. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Option B: Local Development (Requires Node.js/npm)

If you have Node.js installed locally:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment Configuration

Create a `.env` file in the project root. You can use the example:

```bash
# Copy and edit
cp .env.example .env
# Edit .env with your values
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (auto-configured in Docker Compose)
- `JWT_SECRET`: Secret for JWT access tokens (generate strong random string)
- `JWT_REFRESH_SECRET`: Secret for JWT refresh tokens (generate strong random string)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:3000)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Database credentials

### 3. Database Setup (Docker Compose)

When using Docker Compose, database setup is automatic:

```bash
# After starting containers
docker compose exec backend npm run db:generate
docker compose exec backend npm run db:migrate
```

### 4. Start Development Environment

**Using Docker Compose (Recommended):**

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Local Development (Requires Node.js/npm):**

```bash
# Terminal 1: Start database
docker compose up postgres

# Terminal 2: Start backend
cd backend && npm run dev

# Terminal 3: Start frontend
cd frontend && npm run dev
```

## Development URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432
- Prisma Studio: `cd backend && npm run db:studio` (runs on http://localhost:5555)

## Project Structure

```
UniversoteBook/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── database/          # Database migrations and seeds
├── docker-compose.yml # Development environment
└── README.md
```

## Next Steps

1. Test authentication endpoints
2. Create a test user account
3. Begin implementing code editor (Phase 2)

