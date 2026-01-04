# Multi-stage Docker build for Bun.js backend

# Builder stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Accept NPM token as build argument for private package access
ARG NPM_TOKEN
RUN if [ -n "$NPM_TOKEN" ]; then \
      echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc && \
      echo "@flowcore:registry=https://registry.npmjs.org/" >> ~/.npmrc; \
    fi

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Production stage
FROM oven/bun:1 AS production

WORKDIR /app

# Accept NPM token as build argument for private package access
ARG NPM_TOKEN
RUN if [ -n "$NPM_TOKEN" ]; then \
      echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc && \
      echo "@flowcore:registry=https://registry.npmjs.org/" >> ~/.npmrc; \
    fi

# Copy package files
COPY package.json bun.lockb* ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Copy built application from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/flowcore.yaml ./flowcore.yaml

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run the application
CMD ["bun", "run", "src/index.ts"]

