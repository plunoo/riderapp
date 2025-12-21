# 🚴‍♂️ Rider Management System

A comprehensive web application for managing delivery riders, tracking attendance, monitoring live status, and handling administrative tasks.

## ✨ Features

### 👨‍💼 Admin Features
- **User Management**: Create and manage rider accounts
- **Attendance Tracking**: Monitor daily attendance records
- **Live Status Monitoring**: Real-time rider status updates
- **Shift Management**: Schedule and track work shifts
- **Location Tracking**: GPS-based rider location monitoring
- **Excel Export**: Export data for reporting and analysis
- **Role-based Access**: Admin, Prime Admin, and Sub-Admin roles

### 🚴‍♂️ Rider Features
- **Digital Check-in/Check-out**: Easy attendance marking
- **Status Updates**: Update availability and delivery status
- **Dashboard**: Personal performance metrics
- **Shift Viewing**: Access to assigned shifts

### 🔒 Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Different access levels
- **Password Security**: Bcrypt password hashing
- **Audit Logging**: Track admin actions and impersonation

## 🛠 Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: Python ORM
- **JWT**: Secure authentication tokens
- **Bcrypt**: Password hashing
- **Pandas**: Data processing and Excel export

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Axios**: HTTP client
- **React Router**: Client-side routing

### Deployment
- **Docker**: Containerized deployment
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Static file serving and reverse proxy
- **Traefik**: Load balancing and SSL certificates

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for development)
- Python 3.11+ (for development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rider-management
   ```

2. **Start with Docker Compose**
   ```bash
   # Development
   docker-compose up --build

   # Production
   docker-compose -f docker-compose.prod.yml up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Prime Admin Account:**
- Username: `primeadmin`
- Password: `primepass123`

> ⚠️ **Security Warning**: Change these default credentials immediately in production!

## 📁 Project Structure

```
rider-management/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI application entry point
│       ├── models.py            # Database models
│       ├── config.py            # Configuration settings
│       ├── database.py          # Database connection
│       ├── auth/                # Authentication logic
│       └── routers/             # API route handlers
├── frontend/
│   └── src/
│       ├── components/          # Reusable UI components
│       ├── pages/               # Application pages
│       ├── auth/                # Authentication context
│       └── api/                 # API client configuration
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Development configuration
├── docker-compose.prod.yml     # Production configuration
└── DEPLOYMENT.md               # Deployment instructions
```

## 🗃️ Database Schema

### Users Table
- User accounts (Admin, Prime Admin, Sub Admin, Rider)
- Hierarchical relationships (manager_id)
- Role-based access control

### Attendance Table
- Daily attendance records
- Present/Absent/Off-day status
- Unique constraint per rider per day

### Rider Status Table
- Real-time status tracking
- Online/Offline/Delivery/Break statuses
- Timestamp tracking

### Shifts Table
- Work shift scheduling
- Start/end time tracking
- Rider assignment

### Rider Locations Table
- GPS coordinate tracking
- Real-time location updates
- Route monitoring

### Impersonation Logs Table
- Admin action auditing
- User impersonation tracking
- Security compliance

## 🔧 Configuration

### Environment Variables

Create `.env` file from `.env.example`:

```env
# Database
POSTGRES_DB=riderdb
POSTGRES_USER=rider
POSTGRES_PASSWORD=your_secure_password

# JWT Security
JWT_SECRET=your_32_char_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Domain (for production)
DOMAIN=riderapp.johnsonzoglo.com
VITE_API_BASE_URL=https://riderapp.johnsonzoglo.com/api

# Admin Seeding
AUTO_SEED_ADMIN=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PRIME_ADMIN_USERNAME=primeadmin
PRIME_ADMIN_PASSWORD=primepass123
```

## 🚀 Deployment

### Production Deployment

1. **Configure Environment**
   ```bash
   cp .env.example .env
   # Update all values in .env
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **For Dockploy Deployment**
   See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Security Checklist

- [ ] Change default admin passwords
- [ ] Generate strong JWT secret key
- [ ] Set secure database password
- [ ] Configure CORS for your domain
- [ ] Set `AUTO_SEED_ADMIN=false` after initial setup
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups

## 🧪 API Documentation

### Authentication Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/impersonate` - Admin impersonation

### User Management
- `GET /admin/users` - List all users
- `POST /admin/users` - Create new user
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user

### Rider Management
- `GET /riders/` - List riders
- `GET /riders/{id}` - Get rider details
- `PUT /riders/{id}/status` - Update rider status

### Attendance
- `GET /attendance/` - Get attendance records
- `POST /attendance/` - Create attendance record
- `GET /attendance/export` - Export to Excel

### Real-time Features
- Live status updates
- Location tracking
- Attendance monitoring

## 🔍 Monitoring & Health Checks

### Health Check Endpoints
- `GET /health` - Backend health status
- `GET /health` - Frontend health status

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Audit trail for admin actions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Update documentation for new features
- Ensure security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Review the [DEPLOYMENT.md](DEPLOYMENT.md) guide
- Check the API documentation at `/docs`

## 🔄 Version History

- **v1.0.0** - Initial release
  - User authentication and authorization
  - Rider management system
  - Attendance tracking
  - Live status monitoring
  - Excel export functionality
  - Admin dashboard
  - Docker deployment ready

---

**Built with ❤️ for efficient rider management**