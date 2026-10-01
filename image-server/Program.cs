using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

// Local development reads secrets from a git-ignored .env file next to the project (see .env.example).
// Existing environment variables always win, so Docker/production settings are never overridden.
if (string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Development", StringComparison.OrdinalIgnoreCase))
{
    LoadDotEnv(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
}

var builder = WebApplication.CreateBuilder(args);

// Must match backend-api's JwtSettings exactly (same SecretKey/Issuer/Audience) so a
// manager token issued by backend-api is also accepted here.
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];
if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey is missing or shorter than 32 characters. Set JwtSettings__SecretKey in the environment " +
        "or the .env file; it must match the API's value.");
}
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
    options.AddPolicy("RequireManager", policy => policy
        .RequireClaim("scope", "manager")
        .RequireAssertion(context => !context.User.HasClaim("mustChangePassword", "true")));
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
var storageRoot = Path.GetFullPath(storageSection["RootPath"] ?? "/campus-hostels");
var publicBaseUrl = (storageSection["PublicBaseUrl"] ?? "http://images.campushostels.duckdns.org/campus-hostels").TrimEnd('/');
var maxFileSizeBytes = storageSection.GetValue<long?>("MaxFileSizeBytes") ?? 5 * 1024 * 1024;
var allowedExtensions = new HashSet<string>(
    storageSection.GetSection("AllowedExtensions").Get<string[]>() ?? [".jpg", ".jpeg", ".png", ".webp"],
    StringComparer.OrdinalIgnoreCase);
var categories = new HashSet<string>(
    storageSection.GetSection("Categories").Get<string[]>() ?? ["properties", "rooms", "amenities"],
    StringComparer.OrdinalIgnoreCase);

foreach (var category in categories)
{
    Directory.CreateDirectory(Path.Combine(storageRoot, category));
}

var app = builder.Build();

app.UseCors("UploadClients");
app.UseAuthentication();
app.UseAuthorization();

// Uploaded images are served back out publicly (they're embedded via <img> tags across the
// public site), so static file serving is intentionally not gated behind auth.
foreach (var category in categories)
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(Path.Combine(storageRoot, category)),
        RequestPath = $"/campus-hostels/{category}",
        ContentTypeProvider = new FileExtensionContentTypeProvider()
    });
}

app.MapPost("/campus-hostels/{category}/upload", async (string category, HttpRequest request) =>
{
    if (!categories.Contains(category))
    {
        return Results.BadRequest(new { error = $"Unknown category '{category}'. Allowed: {string.Join(", ", categories)}" });
    }

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

    // Optional "name" form field (e.g. "Chiss Towers" or "Chiss Towers room 12") makes the
    // stored file identifiable: chiss-towers-room-12-1.jpg, -2.jpg, ... Falls back to a GUID.
    var slug = Slugify(form["name"].ToString());
    var extensionLower = extension.ToLowerInvariant();
    string fileName;
    FileStream? stream = null;

    if (slug.Length == 0)
    {
        fileName = $"{Guid.NewGuid():N}{extensionLower}";
        stream = new FileStream(Path.Combine(storageRoot, category, fileName), FileMode.CreateNew);
    }
    else
    {
        // CreateNew is atomic, so concurrent uploads can't claim the same number.
        for (var n = 1; stream is null; n++)
        {
            fileName = $"{slug}-{n}{extensionLower}";
            try
            {
                stream = new FileStream(Path.Combine(storageRoot, category, fileName), FileMode.CreateNew);
            }
            catch (IOException) when (File.Exists(Path.Combine(storageRoot, category, $"{slug}-{n}{extensionLower}")))
            {
                // Number taken; try the next one.
            }
        }
        fileName = Path.GetFileName(stream.Name);
    }

    await using (stream)
    {
        await file.CopyToAsync(stream);
    }

    // "path" is environment-independent; clients should store it and prefix their own image host.
    return Results.Ok(new
    {
        url = $"{publicBaseUrl}/{category}/{fileName}",
        path = $"/campus-hostels/{category}/{fileName}"
    });
}).RequireAuthorization("RequireManager");

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

static void LoadDotEnv(string path)
{
    if (!File.Exists(path)) return;
    foreach (var rawLine in File.ReadAllLines(path))
    {
        var line = rawLine.Trim();
        if (line.Length == 0 || line.StartsWith('#')) continue;
        var separator = line.IndexOf('=');
        if (separator <= 0) continue;

        var key = line[..separator].Trim();
        var value = line[(separator + 1)..].Trim();
        if (value.Length >= 2 && value[0] == value[^1] && (value[0] == '"' || value[0] == '\''))
        {
            value = value[1..^1];
        }

        if (Environment.GetEnvironmentVariable(key) is null)
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}

static string Slugify(string? value)
{
    if (string.IsNullOrWhiteSpace(value)) return "";
    var sb = new StringBuilder();
    foreach (var c in value.Trim().ToLowerInvariant())
    {
        if (c is >= 'a' and <= 'z' or >= '0' and <= '9') sb.Append(c);
        else if (sb.Length > 0 && sb[^1] != '-') sb.Append('-');
    }
    var slug = sb.ToString().Trim('-');
    return slug.Length > 80 ? slug[..80].Trim('-') : slug;
}

app.Run();
