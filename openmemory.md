# CodLabStudio - Project Guide

## Overview

CodLabStudio is an enterprise-grade, web-based code execution and development platform engineered to serve software engineers and architects. The system provides a unified, secure interface for writing, executing, and debugging code across multiple programming languages within containerized, isolated environments. This platform addresses the critical need for a platform-agnostic development environment that eliminates local environment setup complexities while maintaining enterprise-level security and audit capabilities.

## Architecture

### System Architecture Pattern

The system follows a three-tier layered architecture with clear separation of concerns:

- **Presentation Layer**: Next.js/React frontend with Monaco Editor integration
- **Application Layer**: Node.js/Express backend services with microservices-oriented design
- **Data Layer**: PostgreSQL database with secure file storage backend

### Technology Stack

**Frontend**:

- Next.js 14 with React 18 and TypeScript
- Monaco Editor (VS Code editor engine) for code editing
- Tailwind CSS 3 for styling
- Socket.io-client for real-time WebSocket communication

**Backend**:

- Node.js with Express.js framework
- Prisma ORM for type-safe database access
- JWT authentication with bcrypt password hashing
- Socket.io for WebSocket server implementation
- Docker API integration for container management

**Database**:

- PostgreSQL 15+ with advanced security features
- Row-level security (RLS) policies for data isolation
- SSL/TLS encryption for all connections
- Connection pooling and query optimization

**Infrastructure**:

- Docker and Docker Compose for containerization
- Language-specific Docker images for execution environments
- Nginx for reverse proxy and load balancing (production)
- S3-compatible storage for file persistence

### Core Components

**Presentation Layer Components**:

- **CodeEditor**: Monaco Editor integration with multi-language syntax highlighting and IntelliSense
- **DebugPanel**: Debug session management with breakpoint visualization and variable inspection
- **FileManager**: Hierarchical file and notebook navigation and management
- **Terminal**: Execution output display with real-time streaming
- **AuthUI**: Authentication and user management interface

**Application Layer Services**:

- **Authentication Service**: User identity management, JWT token generation/validation, RBAC enforcement
- **Execution Engine**: Code execution orchestration, container lifecycle management, output streaming
- **Debug Engine**: Debug session management, debugger protocol translation, real-time debug events
- **Docker Runtime Manager**: Container creation, resource management, security enforcement, cleanup
- **File Service**: Notebook and file CRUD operations, metadata management
- **Notification Service**: WebSocket connection management and event broadcasting
- **Audit Service**: Security logging and compliance audit trail

**Data Layer**:

- **PostgreSQL Database**: Primary data store with RLS, encryption, and ACID compliance
- **File Storage**: S3-compatible or local filesystem for binary file storage

### Security Architecture

The system implements defense-in-depth security with multiple layers:

- Container isolation for code execution with strict resource limits
- Row-level security in database for user data isolation
- JWT-based authentication with refresh token pattern
- Input validation and output encoding to prevent injection attacks
- Rate limiting and resource quotas to prevent abuse
- Comprehensive audit logging for security compliance

### Language Support

**Phase 1 Languages**: Python, JavaScript/Node.js, TypeScript, Java, C/C++, Go, Rust, Ruby, PHP, SQL (PostgreSQL)

Each language executes in a dedicated, isolated Docker container with language-specific runtime, standard libraries, and debugger tools.

## User Defined Namespaces

- [Leave blank - user populates]

## Components

### Authentication Service

- **Location**: `backend/src/services/auth/`
- **Purpose**: User authentication, authorization, and session management
- **Services**: JWT token generation, password hashing, RBAC enforcement
- **I/O**: REST API endpoints, JWT middleware, PostgreSQL (users, sessions tables)

### Execution Engine

- **Location**: `backend/src/services/execution/`
- **Purpose**: Code execution orchestration and lifecycle management
- **Services**: Container creation, execution coordination, output streaming
- **I/O**: REST API, WebSocket streaming, Docker Runtime Manager, PostgreSQL (executions table)

### Debug Engine

- **Location**: `backend/src/services/debug/`
- **Purpose**: Debugging session management and debugger protocol translation
- **Services**: Debug session initialization, breakpoint management, debug event streaming
- **I/O**: REST API, WebSocket (debug events), Docker Runtime Manager, PostgreSQL (debug_sessions table)

### Docker Runtime Manager

- **Location**: `backend/src/services/docker/`
- **Purpose**: Container lifecycle and resource management
- **Services**: Container creation/cleanup, resource limit enforcement, image management
- **I/O**: Docker daemon API, Execution Engine, Debug Engine

### Notification Service

- **Location**: `backend/src/services/notification/`
- **Purpose**: WebSocket connection management and real-time event broadcasting
- **Services**: Socket.IO initialization, user room management, event emission
- **I/O**: Socket.IO server, Execution Engine, Debug Engine

### Debug Service

- **Location**: `backend/src/services/debug/`
- **Purpose**: Debugging session management and debugger protocol translation
- **Services**: Debug session initialization, breakpoint management, debug command execution, debug event streaming
- **I/O**: REST API, WebSocket (debug events), Docker Runtime Manager, PostgreSQL (debug_sessions table)
- **Supported Languages**: Python (debugpy), Node.js (node-inspector)

### Audit Service

- **Location**: `backend/src/services/audit/`
- **Purpose**: Security and compliance logging
- **Services**: Audit log creation, audit log retrieval, compliance reporting
- **I/O**: PostgreSQL (audit_logs table), all services via middleware

## Patterns

### Execution Pattern

User code → Execution Engine → Docker Runtime Manager → Isolated Container → Output Streaming → Database Persistence

### Debug Pattern

User code + breakpoints → Debug Engine → Debug Container → Debugger Attachment → Protocol Translation → Real-time Events → Client

### Authentication Pattern

Credentials → Auth Service → Database Validation → JWT Generation → Token Storage → API Request Authorization

### Data Isolation Pattern

User Request → Authentication → RLS Policy Enforcement → User-Scoped Data Access → Response

### Debug Pattern

User code + breakpoints → Debug Service → Debug Container → Debugger Protocol → Real-time Events → Client Debug Panel

### Security Pattern

Request → Security Headers → Input Sanitization → Size Validation → Rate Limiting → Authentication → Authorization → Audit Logging → Response
