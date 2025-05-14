# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy root package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Copy monorepo specific configurations
COPY tsconfig.build.json ./
COPY nest-cli.json ./

# Install root dependencies
# If you have a yarn.lock or pnpm-lock.yaml, use yarn install --frozen-lockfile or pnpm install --frozen-lockfile
RUN npm ci

# Copy the entire monorepo structure
# This ensures all libs and apps are available for the build context
COPY . .

# Build the specific application (source-data-simulator)
# The --tsc flag ensures it uses the TypeScript compiler directly, good for monorepos
RUN npx nest build source-data-simulator --tsc
# Stage 2: Production environment
FROM node:18-alpine

WORKDIR /usr/src/app

# Set NODE_ENV to production
ENV NODE_ENV production

# Copy only necessary production dependencies from root
COPY package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist/apps/source-data-simulator ./dist/apps/source-data-simulator

# Copy common libs if they are built separately and needed at runtime
# If common libs are bundled into the app's build, this might not be needed
COPY --from=builder /usr/src/app/dist/common ./dist/common

# Expose the port the app runs on
EXPOSE 3002

# Command to run the application
CMD ["node", "dist/apps/source-data-simulator/src/main"]