# =======================================================
# Stage 1: Build Angular Frontend Client
# =======================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/angular-client

# Copy package files and install dependencies
COPY angular-client/package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy Angular source code and build production bundle
COPY angular-client/ ./
RUN npm run build -- --configuration production

# =======================================================
# Stage 2: Build & Publish ASP.NET Core 9 API Backend
# =======================================================
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS backend-builder
WORKDIR /src

# Copy csproj and restore dependencies
COPY Grounded.Api/Grounded.Api.csproj ./Grounded.Api/
RUN dotnet restore ./Grounded.Api/Grounded.Api.csproj

# Copy source code
COPY Grounded.Api/ ./Grounded.Api/

# Copy compiled Angular frontend into wwwroot for unified serving
COPY --from=frontend-builder /app/angular-client/dist/angular-client/browser ./Grounded.Api/wwwroot

# Publish the .NET application
WORKDIR /src/Grounded.Api
RUN dotnet publish Grounded.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# =======================================================
# Stage 3: Lightweight Production Runtime Image
# =======================================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS final
WORKDIR /app

# Set production environment variables
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080 \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# Expose port (8080 is standard for modern ASP.NET Core containers, also configurable via PORT env)
EXPOSE 8080

# Create non-root user for security best practices
USER $APP_UID

# Copy published application
COPY --from=backend-builder --chown=$APP_UID:$APP_UID /app/publish .

# Healthcheck to ensure API and SPA are responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "Grounded.Api.dll"]
