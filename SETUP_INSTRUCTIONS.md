# CampusHostels Full-Stack Setup Instructions

Complete setup guide for the **CampusHostels** full-stack platform with Django Admin backend and React Vite frontend.

## 📋 Table of Contents

1. [Backend Setup (Django + .NET)](#backend-setup-django--net)
2. [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
3. [Environment Configuration](#environment-configuration)
4. [Running Services](#running-services)
5. [Project Structure](#project-structure)
6. [API Integration](#api-integration)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)
9. [Deployment](#deployment)

---

## Backend Setup (Django + .NET)

### Prerequisites

- Python 3.10+ (for Django)
- .NET SDK 9.0+ (for ASP.NET Core)
- SQLite (included with Python)
- PostgreSQL 14+ (for production)

### Step 1: Django Admin Setup

```bash
# 1. Navigate to backend directory
cd backend-admin

# 2. Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate       # Windows
source venv/bin/activate      # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create initial admin user
python manage.py createsuperuser
# Follow prompts: username, email, password

# 5. Run Django development server
python manage.py runserver

# Django admin will be accessible at:
# http://127.0.0.1:8000/admin/
```

**Key Django Apps:**
- `hostel_admin` — Database models and admin interface
- Models: Tenant, Property, Unit, TenancyAgreement, Payment

### Step 2: .NET API Setup

```bash
# 1. Navigate to backend API directory
cd backend-api/CampusHostels.API

# 2. Restore NuGet dependencies
dotnet restore

# 3. Apply Entity Framework migrations
dotnet ef database update

# 4. Run development server
dotnet run

# .NET API will be accessible at:
# https://localhost:7001/ (HTTPS)
# http://localhost:5000/  (HTTP)
```

**Architecture:**
- **Domain** — Entity models (User, Property, Unit, TenancyAgreement, Payment)
- **Application** — DTOs, Services, Validators, Interfaces
- **Infrastructure** — Database context, Repositories
- **API** — Controllers, Middleware, Extensions

---

## Frontend Setup (React + Vite)

### Prerequisites

- Node.js 16.0.0+ (use `node -v` to verify)
- npm 8.0.0+ (included with Node.js)

### Installation Steps

```bash
# 1. Navigate to frontend directory
cd frontend/campushostel-fe

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Frontend will be accessible at:
# http://localhost:5173/
```

### Build for Production

```bash
# Create optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Output will be in: dist/ folder
```

---

## Environment Configuration

### Django Environment Variables

Create a `.env` file in `backend-admin/`:

```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### .NET Environment Variables

Update `backend-api/CampusHostels.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=campushostels.db"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore": "Debug"
    }
  }
}
```

### Frontend Environment Variables

Create a `.env` file in `frontend/campushostel-fe/`:

```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=CampusHostels
```

---

## Running Services

### Option 1: Run All Services Separately (Recommended for Development)

**Terminal 1 — Django Admin:**
```bash
cd backend-admin
.\venv\Scripts\activate
python manage.py runserver

# http://127.0.0.1:8000/admin/
```

**Terminal 2 — .NET API:**
```bash
cd backend-api/CampusHostels.API
dotnet run

# http://localhost:5000/ or https://localhost:7001/
```

**Terminal 3 — React Frontend:**
```bash
cd frontend/campushostel-fe
npm run dev

# http://localhost:5173/
```

### Option 2: Docker Compose (Recommended for Production)

```bash
# From project root
docker-compose up -d

# Services will be available at:
# Frontend:   http://localhost:3000
# .NET API:   http://localhost:8001
# Django:     http://localhost:8000
```

See `docker-compose.yml` for configuration.

---

## Project Structure

```
CampusHostels/
│
├── backend-admin/                 # Django admin interface
│   ├── backend_admin/             # Django project settings
│   ├── hostel_admin/              # Main Django app
│   │   ├── models.py              # Database models
│   │   ├── admin.py               # Admin configuration
│   │   ├── migrations/
│   │   └── views.py               # Views (if needed)
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3
│
├── backend-api/                   # .NET ASP.NET Core API
│   ├── CampusHostels.API/
│   │   ├── Program.cs             # App startup
│   │   ├── API/
│   │   │   ├── Controllers/       # API endpoints
│   │   │   ├── Middleware/
│   │   │   └── Extensions/
│   │   ├── Application/
│   │   │   ├── DTOs/
│   │   │   ├── Services/
│   │   │   ├── Validators/
│   │   │   └── Interfaces/
│   │   ├── Domain/
│   │   │   └── Entities/
│   │   ├── Infrastructure/
│   │   │   ├── Data/
│   │   │   └── Repositories/
│   │   └── appsettings.json
│   └── CampusHostels.API.csproj
│
├── frontend/                      # React + Vite frontend
│   ├── campushostel-fe/
│   │   ├── src/
│   │   │   ├── components/        # Reusable React components
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── HostelCard.jsx
│   │   │   │   ├── HostelGrid.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── README.md
│   │   │   ├── pages/             # Page components
│   │   │   │   ├── HomePage.jsx
│   │   │   │   └── README.md
│   │   │   ├── App.jsx
│   │   │   ├── App.css
│   │   │   ├── index.css          # Tailwind directives
│   │   │   └── main.jsx
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── vite.config.js
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── Docs/
│       ├── RESPONSIVE_PREVIEW.md  # Responsive design testing
│       ├── QA_CHECKLIST.md        # QA test cases
│       └── INTEGRATION_SUMMARY.md # Project overview
│
├── docs/                          # Project documentation
│   ├── domain_and_dto_mapping.md
│   ├── model_relationships.md
│   ├── scaffold_guidelines.md
│   └── relationship_analysis.md
│
├── docker-compose.yml             # Multi-container setup
├── Dockerfile (multiple)
├── Jenkinsfile                    # CI/CD pipeline
├── README.md                      # Project overview
└── CampusHostels.sln              # Visual Studio solution file
```

---

## API Integration

### .NET Backend API Endpoints

The React frontend is configured to use mock data by default. To connect to the .NET backend:

#### 1. Available Endpoints

```
GET    /api/hostels              — List all hostels
POST   /api/hostels/search       — Search with filters
GET    /api/hostels/{id}         — Get hostel details
POST   /api/hostels/{id}/like    — Toggle favorite
GET    /api/users/favorites      — Get user favorites
POST   /api/auth/login           — User login
POST   /api/auth/signup          — User registration
```

#### 2. Request/Response Examples

**Search Hostels:**
```javascript
POST /api/hostels/search
Content-Type: application/json

{
  "location": "Lagos",
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-20",
  "guests": 1
}

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "Student Haven",
      "location": "Lagos",
      "price": 15.99,
      "rating": 4.8,
      "image": "https://unsplash.com/...",
      "tag": "Student Favorite"
    }
  ]
}
```

#### 3. Frontend API Integration Pattern

Update `HomePage.jsx` to fetch from backend:

```javascript
// Replace mock data with API calls
const handleSearch = async (filters) => {
  setIsLoading(true);
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/hostels/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      }
    );
    const data = await response.json();
    setFilteredHostels(data.data || []);
  } catch (error) {
    console.error('Search failed:', error);
    setFilteredHostels([]);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Testing & Verification

### Frontend QA Checklist

See `frontend/campushostel-fe/QA_CHECKLIST.md` for:
- ✅ 120+ test items across 8 categories
- ✅ Responsive design verification (mobile/tablet/desktop)
- ✅ Accessibility compliance (WCAG AA)
- ✅ Performance metrics (Lighthouse)
- ✅ Visual design verification
- ✅ Browser compatibility matrix
- ✅ Screenshot verification at all breakpoints

### Backend Testing

**Django Tests:**
```bash
cd backend-admin
python manage.py test
```

**.NET Tests:**
```bash
cd backend-api
dotnet test
```

### API Testing

Use Postman or VS Code REST Client (`*.http` files):

```http
### Get all hostels
GET http://localhost:5000/api/hostels
Authorization: Bearer YOUR_TOKEN

### Search hostels
POST http://localhost:5000/api/hostels/search
Content-Type: application/json

{
  "location": "Lagos",
  "guests": 1
}
```

---

## Troubleshooting

### Django Issues

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'django'` | Run `pip install -r requirements.txt` in virtual environment |
| `django-jazzmin not found` | Install: `pip install django-jazzmin` |
| `No database tables` | Run: `python manage.py migrate` |
| Port 8000 already in use | Kill process or use: `python manage.py runserver 8001` |

### .NET Issues

| Problem | Solution |
|---------|----------|
| `Entity Framework migration errors` | Run: `dotnet ef database update` |
| `Connection string not found` | Check `appsettings.json` for `DefaultConnection` |
| `CORS errors` | Verify CORS is configured in `Program.cs` |
| Port 5000/7001 in use | Change port in `launchSettings.json` |

### React/Frontend Issues

| Problem | Solution |
|---------|----------|
| `npm ERR! code ERESOLVE` | Run: `npm install --legacy-peer-deps` |
| Styles not applying | Hard refresh: `Ctrl+Shift+R`, clear cache |
| Images not loading | Check Unsplash URLs in Network tab (F12) |
| Hamburger menu not showing | Verify responsive breakpoint in DevTools |
| Port 5173 already in use | Kill process or use: `npm run dev -- --port 3000` |
| `PostCSS plugin error` | Ensure `@tailwindcss/postcss` is installed |

### Docker Issues

| Problem | Solution |
|---------|----------|
| Containers won't start | Check Docker daemon: `docker ps` |
| Port conflicts | Change ports in `docker-compose.yml` |
| Database not persisting | Verify volumes in `docker-compose.yml` |

---

## Deployment

### Frontend Deployment

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend/campushostel-fe
vercel
```

#### Netlify

```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
# Via web UI or CLI: npm i -g netlify-cli && netlify deploy
```

#### Other Platforms (AWS, Azure, GCP)

```bash
# Create production build
npm run build

# Upload dist/ folder to your hosting service
```

### Backend Deployment

#### Docker Deployment

```bash
# From project root
docker-compose up -d

# Verify services
docker-compose ps
```

#### Traditional Server Deployment

**Django:**
```bash
# Use gunicorn + nginx
gunicorn backend_admin.wsgi:application
```

**.NET:**
```bash
# Publish
dotnet publish -c Release -o ./publish

# Run
./publish/CampusHostels.API
```

---

## Database Configuration

### Development (SQLite)

Default configuration. Database file: `backend-admin/db.sqlite3`

### Production (PostgreSQL)

Update connection strings:

**Django:**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'campushostels',
        'USER': 'postgres',
        'PASSWORD': 'your-password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

**.NET:**
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=campushostels;Username=postgres;Password=your-password"
}
```

---

## Key Contacts & Resources

- **Frontend Docs:** `frontend/campushostel-fe/README.md`
- **Component API:** `frontend/campushostel-fe/src/components/README.md`
- **QA Checklist:** `frontend/campushostel-fe/QA_CHECKLIST.md`
- **Django Admin:** http://127.0.0.1:8000/admin/
- **React Dev Server:** http://localhost:5173/

---

## Summary

✅ **Backend Setup:** Django admin + .NET API configured  
✅ **Frontend Setup:** React + Vite with Tailwind CSS  
✅ **Documentation:** Complete setup guides and API specs  
✅ **Testing:** QA checklist with 120+ test items  
✅ **Deployment:** Docker, Vercel, and traditional server options  

**Next Steps:**
1. Follow backend setup for Django and .NET
2. Follow frontend setup for React/Vite
3. Run all services (3 terminals or Docker Compose)
4. Test integration with provided QA checklist
5. Deploy to production using chosen platform

---

**Version:** 1.0.0  
**Last Updated:** November 27, 2025  
**Status:** Production Ready ✅
