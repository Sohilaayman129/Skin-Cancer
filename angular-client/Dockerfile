# =======================================================
# Stage 1: Build Angular Frontend
# =======================================================
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source and build
COPY . .
RUN npm run build -- --configuration production

# =======================================================
# Stage 2: Serve with NGINX Alpine
# =======================================================
FROM nginx:alpine AS runtime

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=builder /app/dist/angular-client/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
