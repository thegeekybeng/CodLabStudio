# CodLabStudio

## Overview

CodLabStudio (pronounced "Colab Studio") is an enterprise-grade, web-based code execution and development platform designed for software engineers and architects. The platform provides a unified interface for writing, executing, and debugging code across multiple programming languages within secure, containerized environments.

## Brand Story

**CodLabStudio** (pronounced "Colab Studio") is a phonetic wordplay that embodies our core mission:
- **Cod** = Code (programming)
- **Lab** = Laboratory (experimentation)
- **Studio** = Collaborative workspace
- **Phonetic**: Sounds like "Colab" = Collaboration

The name reflects our vision: a collaborative code execution studio where teams write, execute, and debug code together in real-time. While we currently provide powerful code execution capabilities, our primary focus is building the future of collaborative coding.

**Tagline**: "Code. Lab. Collaborate."

## Key Features

- **Multi-Language Support**: Execute code in Python, JavaScript/TypeScript, Java, C/C++, Go, Rust, Ruby, PHP (10+ languages)
- **Real-Time Execution**: Stream execution output in real-time via WebSocket connections
- **Secure Execution**: Isolated Docker containers with resource limits (512MB, 1 CPU core) and network isolation
- **Notebook Management**: Create, edit, delete, and search notebooks with intuitive dashboard
- **Code Editor**: Monaco Editor (VS Code engine) with syntax highlighting, IntelliSense, and multi-language support
- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Enterprise Security**: Row-level security, audit logging, rate limiting, and comprehensive access controls
- **Execution History**: Track and view all code executions with results and timing

## Architecture

CodLabStudio follows a three-tier architecture:

- **Presentation Layer**: Next.js/React frontend with Monaco Editor
- **Application Layer**: Node.js/Express backend services
- **Data Layer**: PostgreSQL database with secure file storage

For detailed architectural documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Monaco Editor, Tailwind CSS 3
- **Backend**: Node.js, Express.js, Prisma ORM, Socket.io
- **Database**: PostgreSQL 15+
- **Infrastructure**: Docker, Docker Compose, Nginx

## Documentation

### Core Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Comprehensive system architecture document
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Detailed implementation plan and component interactions
- [SETUP.md](./SETUP.md) - Development setup and configuration guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [FEATURES.md](./FEATURES.md) - Complete feature documentation
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [PROGRESS.md](./PROGRESS.md) - Development progress tracking
- [docs/BRAND_GUIDELINES.md](./docs/BRAND_GUIDELINES.md) - Logo design and brand guidelines

### Setup Guides
- [docs/setup/NAS_SETUP.md](./docs/setup/NAS_SETUP.md) - NAS-specific setup guide
- [docs/setup/NAS_QUICK_START.md](./docs/setup/NAS_QUICK_START.md) - Quick start for NAS
- [docs/setup/ADMIN_SETUP.md](./docs/setup/ADMIN_SETUP.md) - Admin account configuration

### Troubleshooting
- [docs/troubleshooting/](./docs/troubleshooting/) - Troubleshooting guides for common issues

### Scripts
- [scripts/](./scripts/) - Utility scripts for setup, troubleshooting, and testing

## Current Status

### ✅ Completed Features

- **Phase 1: Foundation**

  - Project structure and development environment
  - PostgreSQL database schema with Prisma ORM
  - User authentication and authorization (JWT)
  - Docker Compose configuration
  - Security middleware and rate limiting

- **Phase 2: Core Features**

  - Monaco Editor integration with 11 languages
  - Docker-based code execution engine
  - Real-time execution streaming via WebSocket
  - Execution history and results tracking
  - Notebook CRUD operations

- **Phase 3: Enhanced Features**
  - Dashboard with notebook management
  - Support for 10 programming languages (Python, JavaScript, TypeScript, Java, C/C++, Go, Rust, Ruby, PHP)
  - Search and filter notebooks
  - Improved navigation and user experience

### ✅ Completed Features

- **Debugging Capabilities**: Breakpoints, step execution, variable inspection, call stack (Python & Node.js)
- **Security Hardening**: Security headers, input sanitization, audit logging
- **Production Ready**: Docker production configs, Nginx reverse proxy, deployment docs
- **Package Management**: Install dependencies for Python, Node.js, Java, Go, Rust, Ruby, PHP
- **Git Integration**: Initialize repos, commit, push, pull, status, and commit history
- **Extended Language Support**: 30+ language/version combinations including multiple Python, Node.js, Java, Go, Rust, Ruby, PHP versions plus Swift, Kotlin, Scala, R, Julia, Perl, Bash

### 🚧 Future Enhancements

- **🎯 Collaborative Editing** (Primary Future Feature): Real-time multi-user editing with cursor tracking and participant indicators. Code is already implemented and will be the main differentiator once user registration and persistent notebook management infrastructure is complete. This is our primary focus - building the future of collaborative coding.
- **Execution History UI**: Enhanced visual execution timeline with filtering
- **Advanced Monitoring**: Performance dashboards and metrics
- **Package Search**: Integration with package registries (PyPI, npm, etc.)
- **Git Remote Configuration**: UI for configuring Git remotes

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ and npm 10+
- PostgreSQL 15+ (or use Docker Compose)

### Quick Start

1. **Clone and install dependencies:**

   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

2. **Set up environment variables:**
   Create `.env` files based on the architecture documentation with:

   - Database connection string
   - JWT secrets
   - CORS origin

3. **Start database and run migrations:**

   ```bash
   docker-compose up postgres -d
   cd backend
   npm run db:generate
   npm run db:migrate
   ```

4. **Start development servers:**

   ```bash
   # From root directory
   npm run dev
   ```

   Or use Docker Compose:

   ```bash
   docker-compose up
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Register a new account or login to get started

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Security

CodLabStudio implements multiple layers of security:

- Container isolation for code execution
- Row-level security in database
- JWT-based authentication with refresh tokens
- Input validation and output encoding
- Rate limiting and resource quotas
- Comprehensive audit logging

## License

[To be determined]

## Contributing

[To be determined]

---

For detailed technical information, please refer to the architecture and implementation documentation.
