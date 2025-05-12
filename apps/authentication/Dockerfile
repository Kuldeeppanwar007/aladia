# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./

RUN npm ci

COPY . .

# Build the specific application (authentication)
RUN npx nest build authentication --tsc

# Stage 2: Production environment
FROM node:18-alpine

WORKDIR /usr/src/app

ENV NODE_ENV production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist/apps/authentication ./dist/apps/authentication
# COPY --from=builder /usr/src/app/dist/common ./dist/common

# Expose port if this service also runs an HTTP server (e.g., for health checks)
# EXPOSE 3002 # Default AUTH_HTTP_PORT from .env
# The TCP port for microservice communication doesn't need to be EXPOSEd in Dockerfile
# unless you are connecting to it from outside the Docker network directly.

CMD ["node", "dist/apps/authentication/main"]