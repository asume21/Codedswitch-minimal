# Stage 1: Build the application
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_CACHE=/tmp/npm-cache
ENV NPM_CONFIG_PREFER_OFFLINE=true

# Install build dependencies
RUN apk add --no-cache --virtual .gyp python3 make g++

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci --no-audit --prefer-offline --no-progress

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Stage 2: Create the production image
FROM nginx:alpine

# Install security updates and clean up
RUN apk --no-cache upgrade && \
    rm -rf /var/cache/apk/*

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy _redirects file if it exists
COPY public/_redirects /usr/share/nginx/html/_redirects 2>/dev/null || :

# Set permissions for nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod -R 755 /var/log/nginx && \
    chmod -R 755 /var/cache/nginx

# Remove unnecessary files
RUN rm -rf /usr/share/nginx/html/static/js/*.map \
    /usr/share/nginx/html/static/css/*.map

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Run as non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
