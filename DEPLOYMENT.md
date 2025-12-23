# 🚀 Dokploy Deployment Guide - Rider Management System

## 📋 Quick Deploy Summary

✅ **Production-ready configuration completed**
✅ **Domain configured**: riderapp.johnsonzoglo.com  
✅ **Nginx reverse proxy setup**
✅ **Docker Compose optimized for Dokploy**

## 🔧 Prerequisites

- Dokploy server running
- Domain `riderapp.johnsonzoglo.com` pointed to your server
- Git repository access

## 📁 Project Structure

```
rider-management/
├── backend/
│   └── app/              # FastAPI application
├── frontend/
│   └── src/              # React TypeScript application
├── Dockerfile            # Multi-stage build (backend + frontend)
├── docker-compose.prod.yml # Production configuration
├── nginx-api.conf        # API reverse proxy configuration
├── .env.example          # Environment template
└── DEPLOYMENT.md         # This file
```

## 🚀 Deployment Steps

### 1. **Prepare Environment Variables**

Copy `.env.example` to `.env` and update all values:

```bash
cp .env.example .env
```

**Critical settings to change:**

```env
# Your actual domain
DOMAIN=riderapp.johnsonzoglo.com
VITE_API_BASE_URL=https://riderapp.johnsonzoglo.com/api

# Strong database credentials
POSTGRES_PASSWORD=your_secure_db_password_here

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your_super_secret_32_char_jwt_key

# Admin credentials (change defaults!)
ADMIN_PASSWORD=your_secure_admin_password
PRIME_ADMIN_PASSWORD=your_secure_prime_admin_password
```

### 2. **Deploy on Dockploy**

#### Option A: Git Repository Deploy

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial rider management system"
   git remote add origin YOUR_GIT_URL
   git push -u origin main
   ```

2. **Create New Project in Dockploy**
   - Go to Dockploy dashboard
   - Click "Create Project"
   - Choose "Docker Compose"
   - Connect your Git repository
   - Set build context to project root
   - Use `docker-compose.prod.yml` as compose file

3. **Configure Environment Variables**
   - Add all variables from your `.env` file
   - Ensure `DOMAIN` matches your actual domain
   - Set `VITE_API_BASE_URL` to `https://your-domain.com/api`

#### Option B: Direct Upload

1. **Zip Project Files**
   ```bash
   zip -r rider-management.zip . -x "*.git*" "node_modules/*" "*.env"
   ```

2. **Upload to Dockploy**
   - Create new Docker Compose project
   - Upload the zip file
   - Configure environment variables

### 3. **Domain & SSL Configuration**

Dockploy will automatically handle:
- Traefik reverse proxy routing
- Let's Encrypt SSL certificates
- Domain routing for frontend and API

**Routes configured:**
- `https://riderapp.johnsonzoglo.com` → Frontend (React app)
- `https://riderapp.johnsonzoglo.com/api` → Backend (FastAPI)

### 4. **Database Persistence**

The PostgreSQL data is automatically persisted using Docker volumes:
- Volume: `postgres_data`
- Data survives container restarts and updates

### 5. **Health Checks**

Both services include health checks:
- **Backend**: `GET /health`
- **Frontend**: `GET /health`
- **Database**: PostgreSQL readiness check

## 🔒 Security Configuration

### Post-Deployment Security Checklist

1. **✅ Change Default Passwords**
   - Update admin and prime admin passwords
   - Set strong database password

2. **✅ Disable Admin Seeding**
   ```env
   AUTO_SEED_ADMIN=false
   ```

3. **✅ Configure CORS**
   - Update backend CORS origins to your domain
   - Remove wildcard (*) origins in production

4. **✅ JWT Secret**
   - Use a strong, randomly generated JWT secret
   - Keep it secure and never expose it

## 📊 Monitoring & Logs

### View Logs
```bash
# In Dockploy dashboard
- Go to your project
- Click on service logs
- Monitor backend/frontend/database logs
```

### Health Check Endpoints
- **API Health**: `https://riderapp.johnsonzoglo.com/api/health`
- **Frontend Health**: `https://riderapp.johnsonzoglo.com/health`

## 🛠 Maintenance

### Database Backups
```bash
# Automated backups (if configured in Dockploy)
# Manual backup
docker exec PROJECT_db_1 pg_dump -U rider riderdb > backup.sql
```

### Updates
1. Push code changes to Git
2. Dockploy will auto-rebuild and deploy
3. Zero-downtime deployment with health checks

## 🧪 Testing Deployment

### 1. Access Application
- Frontend: `https://riderapp.johnsonzoglo.com`
- API Docs: `https://riderapp.johnsonzoglo.com/api/docs`

### 2. Test Login
- **Admin**: Username `admin`, Password from your `.env`
- **Prime Admin**: Username `primeadmin`, Password from your `.env`

### 3. Verify Features
- ✅ User authentication
- ✅ Rider management
- ✅ Attendance tracking
- ✅ Live status updates
- ✅ Excel export
- ✅ Admin management (Prime Admin only)

## 🚨 Troubleshooting

### Common Issues

**1. Frontend shows "Login failed"**
- Check API URL in environment variables
- Verify backend container is running
- Check CORS configuration

**2. Database connection errors**
- Verify PostgreSQL container health
- Check database credentials
- Ensure database URL format is correct

**3. SSL/Domain issues**
- Verify domain DNS points to server
- Check Traefik configuration
- Wait for Let's Encrypt certificate generation

**4. Build failures**
- Check Dockerfile syntax
- Verify all required files are present
- Check Docker logs for specific errors

### Support
- Check Dockploy documentation
- Review container logs
- Verify environment variables
- Test local build first

## 📈 Performance Optimization

### Production Recommendations

1. **Database**
   - Configure PostgreSQL connection pooling
   - Set appropriate memory limits
   - Enable query logging if needed

2. **Backend**
   - Adjust worker count based on server specs
   - Configure proper timeout values
   - Enable API rate limiting

3. **Frontend**
   - Static asset caching (handled by nginx)
   - Gzip compression enabled
   - Browser caching headers

4. **Monitoring**
   - Set up health check monitoring
   - Configure log aggregation
   - Monitor resource usage

---

## 🎉 Success!

Your Rider Management System is now deployed and ready for production use!

**Default Access:**
- URL: `https://riderapp.johnsonzoglo.com`
- Admin Login: `admin` / `RiderAdmin2024!`
- Prime Admin: `primeadmin` / `PrimeAdmin2024!`

**Remember to:**
1. Change all default passwords
2. Configure regular backups
3. Monitor system health
4. Keep the system updated