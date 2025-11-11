# Scaffold Guidelines — concrete details for implementing the .NET Web API

This file contains the concrete folder structure, file templates, Program/Startup wiring, dependency-injection registration, EF Core/DbContext guidance, Serilog/CORS/JWT configurations, Docker + docker-compose examples, data-import guidance, and CI/CD workflow skeleton you need to scaffold the solution.

Goal
----
Produce a scaffold that implements the layered architecture:

- /Domain  (pure entities, value objects, domain logic)
- /Application (DTOs, interfaces, services, AutoMapper profiles, validation)
- /Infrastructure (EF Core, Repositories, external adapters, DataImporter tools)
- /API (ASP.NET Core Web API, Controllers, DI, Program.cs)

Folder structure (recommended)
------------------------------
RentIn.sln
src/
  Domain/
    Entities/
    Enums/
    ValueObjects/
    Domain.csproj
  Application/
    DTOs/
    Interfaces/
    Services/
    Mapping/
    Validators/
    Application.csproj
  Infrastructure/
    Data/
      AppDbContext.cs
      Configurations/  (IEntityTypeConfiguration<T> classes)
      Migrations/
    Repositories/
    PaymentGateway/
    Tools/
      DataImporter/
    Infrastructure.csproj
  API/
    Controllers/
    Program.cs
    appsettings.json
    appsettings.Development.json
    API.csproj
tests/
  Application.Tests/
  Infrastructure.Tests/
  API.IntegrationTests/

Concrete file templates and examples
-----------------------------------
Program.cs (minimal .NET 7+ top-level program)

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
       .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
       .AddEnvironmentVariables();

// Serilog
builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration));

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// AutoMapper
builder.Services.AddAutoMapper(typeof(Application.Mapping.MappingProfile));

// EF Core
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// Identity + Auth
builder.Services.AddIdentityCore<Tenant>(options => { /* password rules */ })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters { /* configured below */ };
});

// CORS
builder.Services.AddCors(options => {
    options.AddPolicy("FrontendPolicy", policy =>
        policy.WithOrigins("https://your-frontend-host")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// Application DI registration helper (registers I* -> implementations)
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

AppDbContext wiring (Infrastructure/Data/AppDbContext.cs)

- Register DbSet<T> for each domain entity, override OnModelCreating and apply configurations.
- Keep configuration classes in `Configurations/` (one per entity) that implement IEntityTypeConfiguration<T>.

DesignTimeDbContextFactory for EF tooling

```csharp
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<AppDbContext>();
        // Use SQLite connection string for design-time operations
        builder.UseSqlite("Data Source=rent_in/db.sqlite3");
        return new AppDbContext(builder.Options);
    }
}
```

EntityTypeConfiguration example (Unit)

```csharp
public class UnitConfiguration : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(u => new { u.PropertyId, u.RoomNumber }).IsUnique();
        builder.Property(u => u.Cost).HasColumnType("bigint");
        builder.HasOne(u => u.Property).WithMany(p => p.Units).HasForeignKey(u => u.PropertyId).OnDelete(DeleteBehavior.Cascade);
    }
}
```

Repository pattern example (interface + implementation)

```csharp
public interface IPropertyRepository { Task<Property?> GetByIdAsync(int id); Task<IEnumerable<Property>> GetAllAsync(); Task AddAsync(Property property); }

public class PropertyRepository : IPropertyRepository
{
    private readonly AppDbContext _db;
    public PropertyRepository(AppDbContext db) => _db = db;
    public Task<Property?> GetByIdAsync(int id) => _db.Properties.Include(p => p.Units).FirstOrDefaultAsync(p => p.Id == id);
    public Task<IEnumerable<Property>> GetAllAsync() => _db.Properties.ToListAsync();
    public async Task AddAsync(Property property) { _db.Properties.Add(property); await _db.SaveChangesAsync(); }
}
```

Service interface example

```csharp
public interface IUnitService { Task<IEnumerable<UnitDto>> GetUnitsByPropertyAsync(int propertyId); }

public class UnitService : IUnitService
{
    private readonly IUnitRepository _repo; private readonly IMapper _mapper;
    public UnitService(IUnitRepository repo, IMapper mapper) { _repo = repo; _mapper = mapper; }
    public async Task<IEnumerable<UnitDto>> GetUnitsByPropertyAsync(int propertyId) {
        var units = await _repo.GetByPropertyIdAsync(propertyId);
        return _mapper.Map<IEnumerable<UnitDto>>(units);
    }
}
```

AutoMapper profile location

- `Application/Mapping/MappingProfile.cs` should register all mappings between Domain entities and DTOs.

JWT token config sample (appsettings)

```json
"Jwt": {
  "Key": "<your-long-secret-here>",
  "Issuer": "rentin.api",
  "Audience": "rentin.clients",
  "AccessTokenExpirationMinutes": 60,
  "RefreshTokenExpirationDays": 7
}
```

Program.cs JwtBearer setup (TokenValidationParameters)

```csharp
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = config["Jwt:Issuer"],
    ValidAudience = config["Jwt:Audience"],
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]))
};
```

Serilog minimal configuration (appsettings.json)

```json
"Serilog": {
  "Using": [ "Serilog.Sinks.Console", "Serilog.Sinks.File" ],
  "MinimumLevel": "Information",
  "WriteTo": [ { "Name": "Console" }, { "Name": "File", "Args": { "path": "logs/log-.txt", "rollingInterval": "Day" } } ],
  "Enrich": [ "FromLogContext", "WithMachineName", "WithThreadId" ]
}
```

CORS configuration

- Use `AddCors` as shown in Program.cs and prefer a named policy per environment. For local dev you may allow localhost origins; in production lock to your frontend domain.

Payment gateway adapter interface (IPaymentGateway)

```csharp
public interface IPaymentGateway
{
    Task<InitializeResult> InitializeAsync(PaymentInitializeRequest request);
    Task<VerifyResult> VerifyAsync(string reference);
    Task HandleWebhookAsync(string payload, IDictionary<string,string> headers);
}
```

Paystack adapter responsibilities
- Build init payload and call `/transaction/initialize`.
- Verify transaction with `/transaction/verify/{reference}`.
- Validate webhook signature (HMAC SHA512) and process `charge.success` events idempotently.

Idempotency & webhook safety
- Check Payment.Reference and Payment.Status before processing; use DB transaction and an idempotency table or unique constraints to prevent double-processing.
- Use optimistic concurrency for mutable aggregates (RowVersion/timestamp) if needed.

Data importer guidance (Infrastructure/Tools/DataImporter)
- Create a console app that:
  1. Connects to SQLite (existing db) using EF Core or Dapper.
  2. Reads ordered data: Tenants -> Properties -> Units -> TenancyAgreements -> Payments -> PaymentSummaries.
  3. Maps values to Domain entities and writes to AppDbContext (Postgres) in transactions.
  4. Logs failures and supports resume/retry by keeping a progress checkpoint.

Dockerfile (API)

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["API/API.csproj", "API/"]
COPY ["Infrastructure/Infrastructure.csproj", "Infrastructure/"]
COPY ["Application/Application.csproj", "Application/"]
COPY ["Domain/Domain.csproj", "Domain/"]
RUN dotnet restore "API/API.csproj"
COPY . .
WORKDIR "/src/API"
RUN dotnet publish "API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "API.dll"]
```

docker-compose (Postgres + API)

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: rentin
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: rentin
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: ./
    ports:
      - "5000:80"
    depends_on:
      - db
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=rentin;Username=rentin;Password=secret

volumes:
  pgdata:
```

CI/CD (GitHub Actions) skeleton

`.github/workflows/ci.yml` (build + tests)

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: rentin
          POSTGRES_PASSWORD: secret
          POSTGRES_DB: rentin
        ports: [5432]
        options: >-
          --health-cmd "pg_isready -U rentin" --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '7.0.x'
      - name: Install dependencies
        run: dotnet restore
      - name: Build
        run: dotnet build --no-restore -c Release
      - name: Run tests
        run: dotnet test --no-build -c Release --verbosity normal

```

Testing guidance
- Unit tests: xUnit for services and repositories. Use `Microsoft.EntityFrameworkCore.InMemory` for fast repository tests; prefer Testcontainers or a real Postgres for integration tests.
- Integration tests: Use WebApplicationFactory<TProgram> to run controllers in-memory and test endpoints with authentication.

Validation & FluentValidation
- Add FluentValidation to Application and register `AddFluentValidationAutoValidation()` in Program.cs.
- Create validators for DTOs to mirror Django serializer validation (e.g., username regex numeric-only, required fields).

Swagger/OpenAPI
- Add Swashbuckle and configure JWT bearer support in Swagger UI so you can test authorized endpoints.

Health checks
- Add `Microsoft.Extensions.Diagnostics.HealthChecks` and expose `/health` endpoint; include DB connectivity check and (optionally) external payment API health check.

Security & operational notes
- Store secrets in environment variables or a secrets store (Azure Key Vault, AWS Secrets Manager, or GitHub Actions secrets). Do NOT check secrets into repo.
- Serilog: add Logstash/Seq sink for production centralized logging.
- Rate-limiting: consider adding a rate-limiter for payment initialization endpoints to reduce fraud.

Acceptance & verification checklist (scaffold)
- Solution & projects created and build successfully.
- AppDbContext compiles and EF migrations are created.
- Basic CRUD controllers for Property/Unit/Tenancy/Payment exist and pass integration smoke tests.
- JWT authentication issues tokens and protected endpoints return 401 when unauthenticated.
- Payment webhook endpoint validates signature and is idempotent in tests (simulate payload).
- CORS policy allows the frontend host only in production.

Next steps
- If you want, I can scaffold the Domain and Application folder files (C# skeletons) and the `Infrastructure/Data/AppDbContext` code in the repo. This will be minimal compileable code (no business logic) so you can run `dotnet build` and iterate.
