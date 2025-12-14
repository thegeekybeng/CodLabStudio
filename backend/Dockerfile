FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Update npm to latest version
RUN npm install -g npm@latest

# Install dependencies (use npm install if package-lock.json doesn't exist)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build application
RUN npm run build

# Production stage
FROM node:20-slim AS development

WORKDIR /app

# Install Docker CLI and required libraries for Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    docker.io \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including devDependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Generate Prisma client
RUN npm run db:generate

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install Docker CLI and required libraries for Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    docker.io \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only (use npm install if package-lock.json doesn't exist)
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["node", "dist/index.js"]

