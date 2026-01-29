# CampusHostels AI Agent Instructions

A hostel discovery platform with **Django admin backend**, **.NET 9 API**, and **React 19 + Vite frontend**. This document helps AI agents understand the architecture and be immediately productive.

## 🏗️ Architecture Overview

**Three-tier system:**
1. **Frontend** (React + Tailwind) → `frontend/campushostel-fe/src/`
2. **.NET API** (ASP.NET Core 9) → `backend-api/CampusHostels.API/`
3. **Django Admin** (Data management UI) → `backend-admin/`

**Critical data flow:**
- Frontend calls `.NET API` endpoints (e.g., `/api/Properties`)
- `.NET API` uses **Entity Framework Core** with **SQLite** (dev) / **PostgreSQL** (prod)
- Django admin manages data directly via database ORM (unmanaged in EF, but same DB)

## ⚙️ Core Patterns & Conventions

### Backend (.NET API)
- **Service Layer**: `PropertyService`, `UnitService`, `TenancyService`, `PaymentService`
- **Pattern**: Service → Repository → DbContext (EF Core)
- **DTOs**: Request/response models in `Application/DTOs/` (e.g., `PropertyDto`, `PropertyCreateDto`)
- **AutoMapper**: Automatic entity ↔ DTO conversion in services
- **Validation**: `FluentValidation` for input validation in services
- **Key repositories**: `IPropertyRepository`, `IUnitRepository`, `ITenancyRepository` (dependency injected)
- **Token service**: `ITokenService` for JWT auth (in progress)

**Example service pattern** (see `PropertyService.cs`):
```csharp
public async Task<PropertyDto> CreateAsync(PropertyCreateDto dto)
{
    var entity = _mapper.Map<Property>(dto);
    await _repo.AddAsync(entity);
    await _repo.SaveChangesAsync();
    return _mapper.Map<PropertyDto>(entity);
}
```

### Frontend (React + Tailwind)
- **Components**: Small, reusable, prop-based in `src/components/` (Header, HeroSection, SearchBar, HostelCard, etc.)
- **Pages**: Route destinations in `src/pages/` (HomePage, HostelDetails, Payments, LoginPage, RegisterPage)
- **Services**: API calls in `src/services/` (HostelServices.js for property endpoints, AuthServices.js for login/register)
- **State management**: React hooks (useState, useEffect) - **no Redux/Zustand**
- **Routing**: React Router v7.9.6 with `MainLayout` wrapper for shared Header/Footer
- **API base**: `/api/` (defined in HostelServices.js)

**Example service call** (see `HostelServices.js`):
```javascript
let baseUrl = "/api/Properties";

export const getHostels = async () => {
  const response = await fetch(baseUrl);
  const data = await response.json();
  return data; // Returns array of PropertyDto
};
```

### Domain Model (Shared concept)
- **Property**: Hostel building (Name, Location, StartingPrice, Availability)
- **Unit**: Room/bed in a property (price, type, occupancy)
- **TenancyAgreement**: Lease contract (dates, tenant, payment terms)
- **Payment**: Transaction record (amount, date, status)
- **User**: Tenant identity (phone-based auth, JWT tokens)

## 🚀 Critical Developer Workflows

### Start All Services (Local Dev)

```bash
# Terminal 1: Frontend (port 5173)
cd frontend/campushostel-fe
npm install && npm run dev

# Terminal 2: .NET API (port 5000/7001)
cd backend-api/CampusHostels.API
dotnet restore && dotnet run

# Terminal 3: Django Admin (port 8000)
cd backend-admin
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

### Build & Deploy
- **Frontend build**: `npm run build` → `dist/` folder (minified ~150KB gzipped)
- **Docker**: `docker-compose up --build` (rebuilds all services)
- **CI/CD**: Jenkins pipeline in `Jenkinsfile` (production deployment via SSH)

### Database Migrations
- **.NET migrations**: `dotnet ef migrations add {name}` then `dotnet ef database update`
- **Django migrations**: `python manage.py migrate` (auto-run in Docker on deploy)
- **Both share same database** - EF manages schema, Django reads unmanaged models

## 🔗 Key Integration Points

| Component | Port | URL | Purpose |
|-----------|------|-----|---------|
| Frontend | 5173 | http://localhost:5173/ | Dev server |
| .NET API | 5000 | http://localhost:5000/ | REST endpoints |
| .NET API | 7001 | https://localhost:7001/ | HTTPS (dev) |
| Django Admin | 8000 | http://127.0.0.1:8000/admin/ | Data management |
| PostgreSQL | 5432 | (Docker compose) | Production DB |

## 📝 Common Tasks & Files

| Task | Key Files | Command |
|------|-----------|---------|
| Add API endpoint | Controllers/*.cs, Services/*.cs | `dotnet run` then test with curl |
| Create React component | src/components/*.jsx | `npm run dev` to see hot reload |
| Fetch from API | src/services/HostelServices.js | Add function, export, use in page |
| Add database model | Domain/Entities/*.cs + Migrations/ | `dotnet ef migrations add ...` |
| Validate input | Application/Validators/*.cs | Inject `IValidator<T>` in controller |
| Style component | Add Tailwind classes | Classes in `tailwind.config.js` define colors/spacing |

## ⚡ Quick References

- **Frontend colors**: Primary Teal `#26D0CE`, Accent Coral `#F78F84`, Dark `#2C3E50`
- **Responsive breakpoints**: Mobile (320-640px, 1 col), Tablet (641-1024px, 2 cols), Desktop (1025px+, 3 cols)
- **API response format**: JSON arrays/objects matching DTOs (e.g., `PropertyDto[]`)
- **Component prop pattern**: All interactive components accept `onAction` callbacks (e.g., `onLike`, `onViewDetails`)
- **Testing entry point**: `tests/` folder has integration & unit test projects (mocked repositories recommended)

## 🛠️ When Stuck

1. **API not responding?** Check `backend-api/Logs/` for Serilog output
2. **Frontend 404?** Verify `.NET API` is running and base URL in `HostelServices.js` is correct
3. **Database issues?** Run `dotnet ef database update` after pulling migrations
4. **Django not seeing new models?** Models must be in Django's `hostel_admin/models.py` as "unmanaged" copies of EF entities
5. **CORS errors?** Check `Program.cs` for CORS middleware configuration

## 📚 Reference Files

- Architecture: [PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md)
- Setup: [SETUP_INSTRUCTIONS.md](../SETUP_INSTRUCTIONS.md)
- Quick ref: [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
- Frontend FE_Agent_Instructions.txt: [FE_Agent_Instructions.txt](../frontend/FE_Agent_Instructions.txt)
- Components API: [src/components/README.md](../frontend/campushostel-fe/src/components/README.md)
