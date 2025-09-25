# Webhook Deployment System - Docker Configuration

# Dockerfile untuk webhook deployment system
FROM node:18-alpine

# Install dependencies yang diperlukan
RUN apk add --no-cache git bash curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 9522

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9522/health || exit 1

# Start application
CMD ["npm", "start"]
