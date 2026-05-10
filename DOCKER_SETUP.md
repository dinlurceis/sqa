# Docker Setup Guide - SQA Project

This guide explains how to run your SQA project with frontend and backend on Docker, and MySQL on your local machine.

## Prerequisites

1. **Docker Desktop** installed and running
2. **MySQL 8.0+** installed on your machine
3. **Node.js** 18+ and **npm** (for local development, not needed for Docker)
4. **Maven 3.9+** and **Java 21** (for local development, not needed for Docker)

## Setup Instructions

### Step 1: Set up MySQL on Your Machine

#### Option A: Using MySQL locally (Recommended for development)

1. **Install MySQL Server 8.0**
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use package manager:
     - **Windows**: `choco install mysql` or `winget install MySQL.Server`
     - **macOS**: `brew install mysql`
     - **Linux**: `sudo apt-get install mysql-server`

2. **Start MySQL Service**
   - **Windows**: MySQL typically starts as a service automatically
   - **macOS/Linux**: `brew services start mysql` or `sudo service mysql start`

3. **Create Database**
   ```sql
   -- Connect to MySQL
   mysql -u root -p
   
   -- Create database
   CREATE DATABASE sqa_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- Verify it was created
   SHOW DATABASES;
   ```

4. **Note**: Default credentials in docker-compose.yml:
   - **Username**: `root`
   - **Password**: `123456`
   - **Host**: `localhost` (on your machine) or `host.docker.internal` (from containers)

### Step 2: Build and Run Docker Containers

1. **Navigate to project root**
   ```bash
   cd c:\Users\Zuni\Downloads\sqa-main
   ```

2. **Build Docker images**
   ```bash
   docker compose build
   ```
   This will build:
   - Backend Docker image (Spring Boot)
   - Frontend Docker image (Next.js)

3. **Start the containers**
   ```bash
   docker compose up -d
   ```
   The `-d` flag runs containers in detached mode (in the background)

4. **Verify containers are running**
   ```bash
   docker compose ps
   ```
   You should see both `sqa-backend` and `sqa-frontend` running.

5. **Check logs**
   ```bash
   # View all logs
   docker compose logs -f
   
   # View specific service logs
   docker compose logs -f backend
   docker compose logs -f frontend
   ```

### Step 3: Access Your Application

Once containers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Endpoints**: http://localhost:8080/api/*

## Common Commands

```bash
# Start containers
docker compose up -d

# Stop containers
docker compose down

# Rebuild and restart
docker compose up -d --build

# View logs in real-time
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend

# Execute command in running container
docker compose exec backend bash
docker compose exec frontend sh

# Remove containers and volumes
docker compose down -v
```

## Troubleshooting

### Backend can't connect to MySQL

**Error**: `com.mysql.cj.jdbc.exceptions.CommunicationsException`

**Solution**:
1. Verify MySQL is running on your machine: `mysql -u root -p -e "SELECT 1"`
2. Check that the database `sqa_test` exists
3. Verify connection credentials (root/123456)
4. Check Docker Desktop's network settings

### Frontend can't connect to backend

**Error**: `Failed to fetch` or `ECONNREFUSED`

**Solution**:
1. Ensure backend container is running: `docker compose ps`
2. Check backend logs: `docker compose logs backend`
3. Verify NEXT_PUBLIC_API_URL in docker-compose.yml is set to `http://localhost:8080`

### Port already in use

**Error**: `Bind for 0.0.0.0:3000 failed` or `Bind for 0.0.0.0:8080 failed`

**Solution**:
1. Check what's using the port:
   - **Windows**: `netstat -ano | findstr :3000`
   - **macOS/Linux**: `lsof -i :3000`
2. Either:
   - Kill the process
   - Change ports in docker-compose.yml (e.g., `8001:8080` instead of `8080:8080`)

### Docker image build fails

**Error**: Build process times out or fails

**Solution**:
1. Ensure Docker has enough resources (8GB+ RAM, 2+ CPU cores)
2. Check internet connection for downloading dependencies
3. Run: `docker compose build --no-cache` to rebuild from scratch
4. Check individual build logs: `docker compose build --verbose`

## Optional: Run MySQL in Docker

If you prefer to run MySQL in Docker instead of on your machine:

1. **Uncomment MySQL service** in `docker-compose.yml`:
   - Uncomment the `mysql` service block
   - Uncomment the `volumes` section
   - Update backend `DB_URL` to: `jdbc:mysql://mysql:3306/sqa_test?useSSL=false&serverTimezone=UTC`

2. **Update docker-compose.yml**:
   ```yaml
   backend:
     ...
     environment:
       DB_URL: jdbc:mysql://mysql:3306/sqa_test?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
       DB_USERNAME: root
       DB_PASSWORD: 123456
   ```

3. **Run with MySQL in Docker**:
   ```bash
   docker compose down -v  # Remove old volumes if any
   docker compose up -d
   ```

## Production Considerations

For production deployment:

1. **Change JWT_SECRET** and other sensitive values
2. **Use environment file**: Create `.env` file with production values
3. **Use stronger MySQL password**
4. **Set `HEALTHCHECK` timeouts appropriately**
5. **Configure proper logging and monitoring**
6. **Use persistent volumes for MySQL data**
7. **Set restart policies** (already configured as `unless-stopped`)

## Next Steps

1. Run `docker compose up -d` to start your project
2. Check logs to verify services started correctly
3. Open http://localhost:3000 to access frontend
4. Test API endpoints at http://localhost:8080/api

If you encounter any issues, check the logs first: `docker compose logs -f`
