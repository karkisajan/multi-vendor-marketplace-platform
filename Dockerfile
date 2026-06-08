# ========== Builder stage
# Build the base node image from alpine as Builder
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package lock and package json files
COPY package*.json ./

# Install the dependencies (DevDependencies and Dependencies)
RUN npm install

# COPY everything (Source code, environment variables)
COPY . .

# Build run (Typescript to Javascript compilation)
RUN npm run build

# ========== Production stage
# Build the base node image from alpine as Builder
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy the package lock and package json files
COPY package*.json ./

# Install the dependencies (DevDependencies and Dependencies)
RUN npm install --omit=dev --ignore-scripts

# Copy only the build output from the stage builder
COPY --from=builder /app/dist ./dist

# Run as system group as system user to ensure security risks
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Expose PORT 8000
EXPOSE 8000

# Start the server
CMD ["node", "dist/main.js"]
