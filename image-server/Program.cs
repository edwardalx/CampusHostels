using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Must match backend-api's JwtSettings exactly (same SecretKey/Issuer/Audience) so a
// manager token issued by backend-api is also accepted here.
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new Exception("JwtSettings:SecretKey not configured");
var issuer = jwtSettings["Issuer"] ?? "CampusHostels";
var audience = jwtSettings["Audience"] ?? "CampusHostelsUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireManager", policy => policy.RequireClaim("scope", "manager"));
});

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("UploadClients", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
        }
        else
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
    });
});

var storageSection = builder.Configuration.GetSection("Storage");
var storageRoot = Path.GetFullPath(storageSection["RootPath"] ?? "/campus-hostels/properties");
var publicBaseUrl = (storageSection["PublicBaseUrl"] ?? "http://images.campushostels.duckdns.org/campus-hostels/properties").TrimEnd('/');
var maxFileSizeBytes = storageSection.GetValue<long?>("MaxFileSizeBytes") ?? 5 * 1024 * 1024;
var allowedExtensions = new HashSet<string>(
    storageSection.GetSection("AllowedExtensions").Get<string[]>() ?? [".jpg", ".jpeg", ".png", ".webp"],
    StringComparer.OrdinalIgnoreCase);

Directory.CreateDirectory(storageRoot);

var app = builder.Build();

app.UseCors("UploadClients");
app.UseAuthentication();
app.UseAuthorization();

// Uploaded images are served back out publicly (they're embedded via <img> tags across the
// public site), so static file serving is intentionally not gated behind auth.
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(storageRoot),
    RequestPath = "/campus-hostels/properties",
    ContentTypeProvider = new FileExtensionContentTypeProvider()
});

app.MapPost("/campus-hostels/properties/upload", async (HttpRequest request) =>
{
    if (!request.HasFormContentType)
    {
        return Results.BadRequest(new { error = "Expected multipart/form-data." });
    }

    var form = await request.ReadFormAsync();
    var file = form.Files["file"];
    if (file is null || file.Length == 0)
    {
        return Results.BadRequest(new { error = "No file was uploaded. Expected a form field named 'file'." });
    }

    if (file.Length > maxFileSizeBytes)
    {
        return Results.BadRequest(new { error = $"File exceeds the maximum allowed size of {maxFileSizeBytes / (1024 * 1024)}MB." });
    }

    var extension = Path.GetExtension(file.FileName);
    if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
    {
        return Results.BadRequest(new { error = $"Unsupported file type '{extension}'. Allowed: {string.Join(", ", allowedExtensions)}" });
    }

    var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
    var filePath = Path.Combine(storageRoot, fileName);

    await using (var stream = File.Create(filePath))
    {
        await file.CopyToAsync(stream);
    }

    return Results.Ok(new { url = $"{publicBaseUrl}/{fileName}" });
}).RequireAuthorization("RequireManager");

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
