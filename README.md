# CodLabStudio

**Enterprise-Grade Collaborative Code Execution Platform**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production_ready-green.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

CodLabStudio (pronounced "Colab Studio") is a scalable, secure, and platform-agnostic development environment designed for real-time code execution and debugging. Built to serve engineers and software architects, it provides a unified interface for writing, executing, and debugging code across **30+ programming languages** within isolated, secure containers.

While currently providing robust code execution capabilities code-named "OpenMemory", the platform's architectural foundation is designed for **real-time collaborative coding**, supporting the vision of simultaneous multi-user development.

---

## 🚀 Key Features

### 💻 Advanced Code Editor
*   **Monaco Editor Integration**: Industry-standard editor (VS Code engine) with full IntelliSense.
*   **Multi-Language Support**: Syntax highlighting and execution for 30+ languages including Python, Node.js, Go, Rust, Java, and C++.
*   **Version Management**: Support for multiple runtime versions (e.g., Python 3.10/3.11/3.12, Node 18/20).

### ⚡ Secure Execution Engine
*   **Sandboxed Environment**: Every execution runs in an ephemeral, isolated Docker container with strict resource limits (CPU, Memory, Network).
*   **Real-time Output**: Stdout/Stderr is streamed instantly to the client via WebSockets.
*   **Security First**: Non-root execution, read-only filesystems, and network isolation ensure platform integrity.

### 🐞 Interactive Debugging
*   **Full Debugger Support**: Set breakpoints, step through code, and inspect variables in real-time.
*   **Language Support**: First-class debugging for Python (`debugpy`) and Node.js (`node-inspector`), with architecture to support adapters for GDB/Delve.
*   **Deep Inspection**: View call stacks, watch variables, and analyze runtime state.

### 📦 Package Management
*   **Universal Installer**: Integrated UI to install external libraries for Python (`pip`), Node.js (`npm`), and more.
*   **Guest Access**: Securely allows guest users to install packages for their ephemeral sessions.

---

## 🏗️ System Architecture

CodLabStudio follows a **Microservices-Oriented**, **Three-Tier Architecture** designed for horizontal scalability and fault tolerance.

```mermaid
graph TD
    Client[Client (Next.js)] <-->|WebSocket/REST| Gateway[API Gateway / Nginx]
    Gateway <--> Auth[Auth Service]
    Gateway <--> Exec[Execution Engine]
    Gateway <--> Debug[Debug Service]
    
    Exec --> Docker[Docker Runtime Manager]
    Debug --> Docker
    
    Docker --> Container1[Isolated Container (Py)]
    Docker --> Container2[Isolated Container (Node)]
    
    Auth --> DB[(PostgreSQL)]
    Exec --> DB
```

### Core Components
*   **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS.
*   **Backend**: Node.js + Express + Socket.IO for real-time event streaming.
*   **Database**: PostgreSQL with Prisma ORM for type-safe data access.
*   **Runtime**: Dynamic orchestration of language-specific Docker images (Alpine-based for minimal footprint).

---

## 🛠️ Deployment

### Prerequisites
*   Docker & Docker Compose
*   Node.js 18+ (for local development)

### Quick Start (Production)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/codlabstudio.git
    cd codlabstudio
    ```

2.  **Configure Environment**
    Copy the example configuration:
    ```bash
    cp .env.example .env.prod
    # Edit .env.prod with your secure secrets
    ```

3.  **Launch Services**
    ```bash
    docker-compose -f docker-compose.yml up -d --build
    ```

4.  **Access Platform**
    *   Web Interface: `http://localhost` (or your configured domain)
    *   API: `http://localhost/api`

---

## 🔒 Security Architecture

CodLabStudio implements a **Defense-in-Depth** strategy:

1.  **Authentication**: JWT-based stateless auth with short-lived access tokens and secure HTTP-only refresh tokens.
2.  **Container Isolation**: User code runs in disposable containers with no access to the host or other containers.
3.  **Network Policies**: Egress is blocked by default to prevent malicious external connections.
4.  **Resource Quotas**: Strict CPU/RAM limits prevent Denial of Service (DoS) attacks.
5.  **Audit Logs**: Comprehensive audit trail of all executions, installations, and system events.

---

## 🔮 Roadmap

*   **Real-Time Collaboration**: Multi-user editing with cursor tracking (CRDT-based).
*   **Git Integration**: Direct commit/push/pull from the workspace.
*   **Cloud Sync**: Persistent workspace storage across sessions.

---

**Architected with ❤️ by The Geeky Beng**

## Executive Architecture Summary

CodLabStudio represents a distinct evolution in collaborative development environments, architected as a **distributed, container-native solution** for secure polyglot code orchestration. Designed with **security-first principals** and **horizontal scalability** in mind, it provides a robust platform where engineering teams can develop, execute, and debug code in real-time across isolated environments.


## System Architecture

The platform implements a **three-tier microservices-ready architecture**, interacting via RESTful APIs and WebSocket streams, fully encapsulated within a Docker composition for deterministic deployment.

### 1. Presentation Layer (Frontend)
- **Framework**: **Next.js 14** implementing a hybrid rendering strategy (SSR/CSR) for optimal TTI (Time to Interactive) and SEO.
- **Engine**: Integrated **Monaco Editor** (VS Code core) providing a rich IDE-grade experience with IntelliSense and massive language support.
- **State Management**: Reactive data flow ensures real-time synchronization of execution states.

### 2. Application Layer (Backend & Orchestration)
- **Runtime**: **Node.js** service layer handling authentication, business logic, and container orchestration.
- **Communication Patterns**: 
  - **REST**: Synchronous operations (User management, Persistence).
  - **WebSockets (Socket.io)**: Asynchronous, full-duplex communication for real-time `stdout`/`stderr` streaming from execution containers.
- **Security**: 
  - **JWT Strategy**: Stateless authentication with rotation-ready refresh tokens.
  - **Input Sanitization**: Request validation via Zod schemas at ingress points.

### 3. Execution Plane (The Core)
- **Isolation Strategy**: Code execution occurs within **ephemeral Docker containers**. This "Sandbox-as-a-Service" model ensures:
  - **Resource Quotas**: Strict CPU and Memory limits (cgroups).
  - **Network Policy**: Isolated bridge networks preventing lateral movement.
  - **Ephemeral Lifecycle**: Containers are spun up on-demand and destroyed post-execution, ensuring no state contamination.

### 4. Data & Persistence Layer
- **Primary Store**: **PostgreSQL 15+** managed via **Prisma ORM** for type-safe database access and schema migrations.
- **Data Integrity**: Enforced via rigorous schema definitions and relational constraints (ACID compliance).

### 5. Ingress & Edge
- **Reverse Proxy**: **Nginx** acting as the API Gateway, handling:
  - **SSL Termination**: Offloading encryption overhead.
  - **Request Routing**: Directing traffic to Frontend or Backend services.
  - **Security Headers**: HSTS, X-Frame-Options enforcement.

## Operational Excellence

### Deployment Strategy
The solution is containerized using **Docker Compose** for reliable, reproducible deployments across environments (Dev, Test, Prod).
- **Service Mesh Ready**: Architecture allows for decomposition into Kubernetes services (Pods/Services) for scaling individual components.
- **Configuration Management**: Strict separation of config from code via `.env` injection.

### Security Posture
- **Network Segmentation**: Database and internal services sit on a private backend network, inaccessible to the public internet.
- **Audit Trails**: Comprehensive logging of execution events tied to identities.
- **Rate Limiting**: DOS protection implemented at the middleware layer.

## Quick Start: Production Topology

Deploy the full stack including the database, application services, and ingress gateway.

### Prerequisites
- Docker Engine & Docker Compose (V2 recommended)

### Deployment Command
Execute the verified production composition:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Access Points
- **Web Interface**: `http://localhost:8080` or `https://localhost:8443`
- **Health Checks**: Containers implement internal health checks to ensure traffic is only routed to healthy instances.

## Technical Specifications

| Component | Technology | Role |
|-----------|------------|------|
| **Frontend** | Next.js / TypeScript | UI/UX, Client Logic |
| **Backend** | Express / Node.js | API, Orchestration |
| **Database** | PostgreSQL | Persistence |
| **ORM** | Prisma | Data Access Layer |
| **Proxy** | Nginx (Alpine) | Ingress Controller |
| **Runtime** | Docker | Execution Sandbox |

---

*Architected for reliability, designed for speed, and built for security. CodLabStudio establishes the standard for modern collaborative execution environments.*
