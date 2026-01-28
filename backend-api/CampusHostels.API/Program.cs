using CampusHostels.API.API.Extensions;
using CampusHostels.API.API.Middleware;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Serilog;
using AutoMapper;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
// if (builder.Environment.IsDevelopment())
// {
//     builder.WebHost.UseUrls("http://localhost:5077", "https://localhost:7102");
// }
// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
// AutoMapper (manual registration to avoid extension dependency issues)
builder.Services.AddSingleton(provider =>
{
    var config = new MapperConfiguration(cfg => cfg.AddProfile(new CampusHostels.API.Application.Mapping.MappingProfile()));
    return config.CreateMapper();
});
// Register repositories
builder.Services.AddScoped<CampusHostels.API.Infrastructure.Repositories.IPropertyRepository, CampusHostels.API.Infrastructure.Repositories.EfPropertyRepository>();
builder.Services.AddScoped<CampusHostels.API.Infrastructure.Repositories.IUnitRepository, CampusHostels.API.Infrastructure.Repositories.EfUnitRepository>();
builder.Services.AddScoped<CampusHostels.API.Infrastructure.Repositories.ITenancyRepository, CampusHostels.API.Infrastructure.Repositories.EfTenancyRepository>();
// Token service
builder.Services.AddScoped<CampusHostels.API.Application.Interfaces.ITokenService, CampusHostels.API.Application.Services.TokenService>();
// Account service
builder.Services.AddScoped<CampusHostels.API.Application.Interfaces.IAccountService, CampusHostels.API.Application.Services.AccountService>();
// Payment service (registered so PaymentsController DI resolves)
builder.Services.AddScoped<CampusHostels.API.Application.Interfaces.IPaymentService, CampusHostels.API.Application.Services.PaymentService>();
builder.Services.AddSwaggerGen();

// Database Configuration - Auto-detect based on environment
// Resolve relative SQLite paths to absolute paths so tests and different working directories can open the DB file.
if (builder.Environment.IsDevelopment())
{
    Console.WriteLine("🚀 DEVELOPMENT: Using SQLite database");
    var originalConn = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
    var resolvedConn = originalConn;
    try
    {
        const string dataSourceKey = "Data Source=";
        var idx = originalConn.IndexOf(dataSourceKey, StringComparison.OrdinalIgnoreCase);
        if (idx >= 0)
        {
            var pathPart = originalConn.Substring(idx + dataSourceKey.Length);
            var semicolon = pathPart.IndexOf(';');
            var relativePath = semicolon >= 0 ? pathPart.Substring(0, semicolon) : pathPart;
            relativePath = relativePath.Trim();
            if (!string.IsNullOrEmpty(relativePath) && !Path.IsPathRooted(relativePath))
            {
                var basePath = builder.Environment.ContentRootPath ?? AppContext.BaseDirectory;
                var abs = Path.GetFullPath(Path.Combine(basePath, relativePath));
                resolvedConn = dataSourceKey + abs + (semicolon >= 0 ? pathPart.Substring(semicolon) : string.Empty);
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Failed to resolve SQLite path: {ex.Message}");
    }

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(resolvedConn));
}
else
{
    Console.WriteLine("🐘 PRODUCTION: Using PostgreSQL database");
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// JWT Authentication
builder.Services.AddJwtAuthentication(builder.Configuration);

// CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5000", 
            "https://localhost:5000",
            "http://your-frontend-domain.com",
            "https://campushostels.duckdns.org/"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// Register validators and enable FluentValidation automatic model validation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CampusHostels.API.Application.Validators.RegisterDtoValidator>();

// Register existing validators (kept for explicit registration compatibility)
builder.Services.AddTransient<FluentValidation.IValidator<CampusHostels.API.Application.DTOs.UnitCreateDto>, CampusHostels.API.Application.Validators.UnitCreateDtoValidator>();
builder.Services.AddTransient<FluentValidation.IValidator<CampusHostels.API.Application.DTOs.TenancyCreateDto>, CampusHostels.API.Application.Validators.TenancyCreateDtoValidator>();

// Serilog Configuration
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();

    // Auto-create and migrate SQLite database in development
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        try
        {
            dbContext.Database.Migrate();
            Console.WriteLine("✅ SQLite database created/migrated");
        }
        catch (InvalidOperationException ex)
        {
            // EF throws if there are pending model changes not represented in migrations.
            // In the test/dev environment we prefer to create the database schema instead
            // of failing the whole application start. Log and fall back to EnsureCreated.
            var message = ex.Message ?? string.Empty;
            if (message.Contains("PendingModelChangesWarning"))
            {
                Console.WriteLine("⚠️ Pending EF model changes detected. Skipping automatic migrations and using EnsureCreated() for dev/test.");
                dbContext.Database.EnsureCreated();
            }
            else
            {
                // rethrow other unexpected InvalidOperationExceptions
                throw;
            }
        }
        catch (Exception e)
        {
            // Don't let unexpected errors stop the app during development startup; surface the error and continue.
            Console.WriteLine($"⚠️ Exception while applying migrations: {e.Message}");
        }
    }
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}
foreach (var url in app.Urls)
{
    Console.WriteLine($"🚀 API running at: {url}");
}
// Only use HTTPS redirection in Development
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Expose Program type for integration tests
public partial class Program { }