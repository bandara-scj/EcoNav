# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Node.js
FROM node:20-alpine

WORKDIR /app

# Copy the built assets and server file from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY server.js ./

# Install only production dependencies (express)
RUN npm install --omit=dev

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]
