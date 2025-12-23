# CLAUDE.md - Rider Management System Development Guide

## 🏗️ Architecture Overview

This is a comprehensive rider management system for delivery companies with:

- **Backend**: FastAPI + PostgreSQL + SQLAlchemy ORM
- **Frontend**: React 18 + TypeScript + Vite
- **Deployment**: Docker + Docker Compose
- **Authentication**: JWT with role-based access (Prime Admin > Sub Admin > Admin > Rider)
- **Database**: PostgreSQL with hierarchical user management

## 🚀 Quick Development Commands

### Start Development Environment
```bash
# Full stack development
docker-compose up --build

# Frontend only (requires backend running)
cd frontend && npm run dev

# Backend only (requires DB running)
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Management
```bash
# Access PostgreSQL directly
PGPASSWORD=riderpass psql -h localhost -p 5432 -U rider -d riderdb

# Access pgAdmin (web interface)
# http://localhost:5050
# Email: admin@admin.com, Password: admin

# Database backup
docker exec <postgres_container> pg_dump -U rider riderdb > backup.sql
```

### Testing & Debugging
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Health checks
curl http://localhost:8000/health
curl http://localhost:5173/health

# API documentation
open http://localhost:8000/docs
```

## 🗄️ Database Schema

### Key Tables
- **users**: Hierarchical user management with role-based access
- **attendance**: Daily rider attendance tracking
- **rider_status**: Real-time status updates (Online/Offline/Delivery/Break)
- **shifts**: Work shift scheduling and tracking
- **rider_locations**: GPS coordinate tracking
- **impersonation_logs**: Admin action auditing

### Important Database Details
- Default admin credentials: admin/123456789, primeadmin/123456789
- Auto-seeding enabled in development (AUTO_SEED_ADMIN=true)
- Password hashing uses bcrypt via passlib
- JWT tokens expire in 1440 minutes (24 hours)

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
POSTGRES_DB=riderdb
POSTGRES_USER=rider
POSTGRES_PASSWORD=riderpass

# JWT Security
JWT_SECRET=your_jwt_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=123456789
PRIME_ADMIN_USERNAME=primeadmin
PRIME_ADMIN_PASSWORD=123456789

# Frontend API URL
VITE_API_BASE_URL=http://localhost:8000
```

## 🏢 Project Structure

### Backend (`/backend/app/`)
- `main.py`: FastAPI app entry point
- `models.py`: SQLAlchemy database models
- `database.py`: DB connection and session management
- `config.py`: Environment configuration
- `auth/`: JWT authentication logic
- `routers/admin.py`: Admin management endpoints
- `routers/auth.py`: Authentication endpoints

### Frontend (`/frontend/src/`)
- `components/`: Reusable UI components
- `pages/`: Application pages (Dashboard, Login, etc.)
- `auth/AuthContext.tsx`: JWT authentication context
- `api/`: API client configuration

### Key Dependencies
- **Backend**: FastAPI, SQLAlchemy, psycopg2-binary, python-jose, passlib[bcrypt]
- **Frontend**: React 18, TypeScript, Vite, Axios, React Router

## 🔐 Authentication & Authorization

### Role Hierarchy
1. **Prime Admin**: Full system access, can manage other admins
2. **Sub Admin**: Can manage riders and view analytics
3. **Admin**: Basic rider management
4. **Rider**: Personal dashboard and status updates

### API Authentication
- All protected endpoints require JWT Bearer token
- Token obtained via `POST /auth/login`
- Admin impersonation available via `POST /auth/impersonate`

## 🧪 Testing Guidelines

### Manual Testing Workflow
1. Start development environment: `docker-compose up --build`
2. Access frontend: http://localhost:5173
3. Login with admin credentials (admin/123456789)
4. Test key features:
   - User management (add/edit/delete riders)
   - Attendance tracking
   - Live status updates
   - Excel export functionality
   - Dashboard analytics

### API Testing
- Swagger UI: http://localhost:8000/docs
- All admin endpoints under `/admin/` prefix
- Authentication required for most endpoints

## 🚨 Common Issues & Solutions

### Docker Issues
- **Backend import errors**: Ensure Dockerfile copies `backend/app ./app` (not just `./`)
- **Missing dependencies**: Check `requirements.txt` includes `passlib[bcrypt]`
- **Frontend API connectivity**: Rebuild frontend with correct `VITE_API_BASE_URL`

### Database Issues
- **Connection refused**: Ensure PostgreSQL container is running
- **Authentication failed**: Check POSTGRES_USER/PASSWORD in .env
- **Migration issues**: Drop volumes and rebuild if schema changes

### Authentication Issues
- **Login failed**: Verify API URL in frontend environment
- **Token expired**: JWT tokens last 24 hours, get fresh token
- **CORS errors**: Ensure backend CORS allows frontend origin

## 📊 Key Features Implementation

### Real-time Features
- Rider status tracking via `PUT /riders/{id}/status`
- Location updates via `POST /riders/{id}/location`
- Live dashboard updates (polling-based)

### Excel Export
- Attendance export: `GET /attendance/export`
- Uses pandas and openpyxl libraries
- Includes date range filtering

### Admin Management
- Hierarchical user management in `users` table
- Manager relationships via `manager_id` foreign key
- Role-based endpoint access control

## 🔄 Development Workflow

### Adding New Features
1. Update database models in `models.py` if needed
2. Create API endpoints in appropriate router
3. Update frontend components/pages
4. Test with both manual and API testing
5. Update documentation if significant changes

### Database Migrations
- Currently using SQLAlchemy create_all() for simplicity
- For production, implement proper migration system (Alembic)

## 🚀 Deployment Notes

- Production config in `docker-compose.prod.yml`
- Uses Nginx for frontend static file serving
- Traefik labels for SSL and routing in production
- Health checks configured for all services
- See `DEPLOYMENT.md` for detailed production setup

## 💡 Development Tips

- Use pgAdmin (localhost:5050) for database inspection
- Check container logs when debugging issues
- Frontend hot reload enabled in development
- Backend auto-reload with uvicorn --reload
- All passwords currently set to "123456789" for development
- JWT secret should be changed for production use