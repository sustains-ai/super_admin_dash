# Super Admin Dashboard

A comprehensive Super Admin Dashboard with User Access Control built with React frontend and Django REST Framework backend.

## 🚀 Features

### Authentication System
- JWT-based authentication with access and refresh tokens
- Persistent user session (expires after 1 hour of inactivity)
- Separate login flows for super admin and regular users
- Password recovery with OTP verification

### User Management
- Super admin can create users with auto-generated strong passwords
- Users can update their profile details (except email)
- Users can reset passwords via OTP verification
- Users can view their assigned permissions but cannot modify them

### Access Control & Permissions
- Super admin can assign and manage user permissions for 10 predefined pages
- Each user can have View, Edit, Create, and Delete access for specific pages
- Admin dashboard displays user-role table with assigned page permissions
- Right-side panel for managing user permissions dynamically

### Content Management
- Each page includes a comment section with CRUD operations
- Permission-based comment management (view, edit, create, delete)
- Comments are visible to all users with view access
- Modification history tracking for all comments

### Dynamic Pages (10 Pages)
1. Products List
2. Marketing List
3. Order List
4. Media Plans
5. Offer Pricing SKUs
6. Clients
7. Suppliers
8. Customer Support
9. Sales Reports
10. Finance & Accounting

## 🛠️ Tech Stack

### Backend
- **Django 5.1.5** - Web framework
- **Django REST Framework 3.16.1** - API framework
- **Django REST Framework Simple JWT 5.5.1** - JWT authentication
- **Django CORS Headers 4.7.0** - CORS handling
- **SQLite** - Database (for development)

### Frontend (Coming Soon)
- **React** - Frontend framework
- **Bootstrap** - UI framework
- **Axios** - HTTP client

## 📁 Project Structure

```
Super_admin_dashboard/
├── backend/                 # Django backend
│   ├── backend/            # Django project settings
│   ├── dashboard/          # Main Django app
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API views
│   │   ├── serializers.py  # DRF serializers
│   │   ├── admin.py        # Django admin
│   │   └── management/     # Custom management commands
│   ├── requirements.txt    # Python dependencies
│   └── manage.py          # Django management script
├── frontend/              # React frontend (coming soon)
├── venv/                  # Python virtual environment
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+ (for frontend)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sustains-ai/super_admin_dash.git
   cd super_admin_dash
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or
   source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Initialize database with default data**
   ```bash
   python manage.py init_data
   ```

6. **Start the development server**
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Super Admin Credentials
After running `init_data`, you'll get super admin credentials:
- **Email**: admin@superadmin.com
- **Password**: [Auto-generated, shown in terminal]

### Frontend Setup (Coming Soon)
```bash
cd frontend
npm install
npm start
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/password-reset/` - Password reset request
- `POST /api/auth/password-reset/confirm/` - Password reset confirmation

### User Management Endpoints
- `GET /api/users/` - List users (super admin only)
- `POST /api/users/` - Create user (super admin only)
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user (super admin only)

### Permission Management Endpoints
- `GET /api/permissions/` - List permissions
- `POST /api/permissions/` - Create permission (super admin only)
- `PUT /api/permissions/{id}/` - Update permission (super admin only)
- `DELETE /api/permissions/{id}/` - Delete permission (super admin only)

### Page Management Endpoints
- `GET /api/pages/` - List pages
- `GET /api/pages/{id}/` - Get page details

### Comment Management Endpoints
- `GET /api/pages/{page_id}/comments/` - List comments for a page
- `POST /api/pages/{page_id}/comments/` - Create comment
- `PUT /api/comments/{id}/` - Update comment
- `DELETE /api/comments/{id}/` - Delete comment
- `GET /api/comments/{id}/history/` - Get comment history

## 🔐 Security Features

- JWT token-based authentication
- Role-based access control
- Permission-based page access
- Session management with inactivity timeout
- Password strength validation
- CORS protection

## 🧪 Testing

```bash
# Run backend tests
cd backend
python manage.py test

# Run frontend tests (coming soon)
cd frontend
npm test
```

## 📝 Development Status

### ✅ Completed
- [x] Django project setup
- [x] Database models and migrations
- [x] Admin interface
- [x] Database initialization
- [x] Git repository setup

### 🚧 In Progress
- [ ] Authentication APIs
- [ ] User management APIs
- [ ] Permission management APIs

### 📋 Planned
- [ ] React frontend setup
- [ ] Authentication UI
- [ ] Admin dashboard
- [ ] User management interface
- [ ] Dynamic pages with comments
- [ ] Permission-based UI rendering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **arjuncrevathi@gmail.com** - Project collaborator

## 🆘 Support

For support, email arjuncrevathi@gmail.com or create an issue in the repository.
