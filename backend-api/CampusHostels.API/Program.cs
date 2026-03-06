using AutoMapper;
using CampusHostels.API.API.Extensions;
using CampusHostels.API.API.Middleware;
using CampusHostels.API.Application.Mapping;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Validators;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using DotNetEnv;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
// Load .env and add to configuration
Env.Load();

// Add to configuration builder (this will include all env vars including those from .env)
builder.Configuration.AddEnvironmentVariables();

#region Core MVC & API
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "CampusHostels API",
        Version = "v1"
    });

    // Add JWT Bearer Authorization
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter JWT token like: Bearer {your token}"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});
#endregion

#region AutoMapper
builder.Services.AddSingleton<IMapper>(_ =>
{
    var config = new MapperConfiguration(cfg =>
        cfg.AddProfile(new MappingProfile()));
    return config.CreateMapper();
});
#endregion

#region Repositories
builder.Services.AddScoped<IPropertyRepository, EfPropertyRepository>();
builder.Services.AddScoped<IUnitRepository, EfUnitRepository>();
builder.Services.AddScoped<ITenancyRepository, EfTenancyRepository>();
builder.Services.AddScoped<IMessageRepository, EfMessageRepository>();
#endregion

#region Services
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ITenancyService, TenancyService>();
builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();
builder.Services.AddScoped<EmailService>(); // Not interface-based since it's only used internally by other services
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>(); // Register IEmailSender to resolve to EmailService
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
#endregion

#region WhatsApp Service (Whapi.Cloud)
builder.Services.AddHttpClient<IWhatsAppService, WhatsAppService>(); // Configuration and token handling is done inside the service constructor
#endregion

// #region Email Service (SendGrid)
// builder.Services.AddTransient<EmailService>();
// #endregion

#region Paystack
builder.Services.AddHttpClient<CampusHostels.API.Application.Interfaces.IPaystackService, CampusHostels.API.Application.Services.PaystackService>((client) =>
{
    var baseUrl = builder.Configuration["Paystack:BaseUrl"] ?? "https://api.paystack.co/";
    client.BaseAddress = new Uri(baseUrl);
    client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
    var secret = builder.Configuration["Paystack:SecretKey"];
    if (!string.IsNullOrEmpty(secret))
    {
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", secret);
    }
});
#endregion

#region Database
if (builder.Environment.IsDevelopment())
{
    Console.WriteLine("🚀 DEVELOPMENT: Using SQLite database");

    var originalConn = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
    var resolvedConn = ResolveSqlitePath(originalConn, builder.Environment.ContentRootPath);

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(resolvedConn));
}
else
{
    Console.WriteLine("🐘 PRODUCTION: Using PostgreSQL database");

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
}
#endregion

#region Authentication & Authorization
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new Exception("JwtSettings:SecretKey not configured");
var issuer = jwtSettings["Issuer"] ?? "CampusHostels";
var audience = jwtSettings["Audience"] ?? "CampusHostelsUsers";

var signingKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secretKey));

var tokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
{
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = signingKey,
    ValidateIssuer = true,
    ValidIssuer = issuer,
    ValidateAudience = true,
    ValidAudience = audience,
    ValidateLifetime = true,
    ClockSkew = TimeSpan.Zero
};

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = tokenValidationParameters;

    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var logger = context.HttpContext.RequestServices.GetService<Microsoft.Extensions.Logging.ILogger<Program>>();
            try
            {
                var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    // Trim prefix, surrounding quotes and whitespace
                    var token = authHeader.Substring("Bearer ".Length).Trim().Trim('"').Trim();
                    if (!string.IsNullOrEmpty(token))
                    {
                        var prefix = token.Length > 8 ? token.Substring(0, 8) : token;
                        logger?.LogDebug("Received Authorization token (len={Len}, prefix={Prefix})", token.Length, prefix);
                        context.Token = token;
                    }
                }
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Error processing Authorization header");
            }

            return Task.CompletedTask;
        },

        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetService<Microsoft.Extensions.Logging.ILogger<Program>>();
            logger?.LogWarning(context.Exception, "JWT authentication failed");
            return Task.CompletedTask;
        },

        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetService<Microsoft.Extensions.Logging.ILogger<Program>>();
            logger?.LogWarning("JWT challenge: {Error} - {ErrorDescription}", context.Error, context.ErrorDescription);
            return Task.CompletedTask;
        }
    };
});
#endregion


#region CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5000",
                "https://localhost:5000",
                "http://your-frontend-domain.com",
                "https://campushostels.duckdns.org/",
                "http://localhost:5173",      // React dev server
                "https://campushostels.duckdns.org") // Production fro
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
#endregion

#region FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();
#endregion

#region Logging
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));
#endregion

var app = builder.Build();

#region Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    try
    {
        dbContext.Database.Migrate();
        Console.WriteLine("✅ Database migrated");
    }
    catch (InvalidOperationException ex) when (ex.Message.Contains("PendingModelChangesWarning"))
    {
        Console.WriteLine("⚠️ Pending model changes detected. Using EnsureCreated()");
        dbContext.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Migration error: {ex.Message}");
    }
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

foreach (var url in app.Urls)
{
    Console.WriteLine($"🚀 API running at: {url}");
}

app.Run();
#endregion

#region Helpers
static string ResolveSqlitePath(string connectionString, string? contentRoot)
{
    try
    {
        const string key = "Data Source=";
        var idx = connectionString.IndexOf(key, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return connectionString;

        var pathPart = connectionString[(idx + key.Length)..];
        var semicolon = pathPart.IndexOf(';');
        var relativePath = semicolon >= 0 ? pathPart[..semicolon] : pathPart;

        if (Path.IsPathRooted(relativePath)) return connectionString;

        var basePath = contentRoot ?? AppContext.BaseDirectory;
        var absPath = Path.GetFullPath(Path.Combine(basePath, relativePath));

        return key + absPath + (semicolon >= 0 ? pathPart[semicolon..] : string.Empty);
    }
    catch
    {
        return connectionString;
    }
}
#endregion

// Expose Program for integration tests
public partial class Program { }
