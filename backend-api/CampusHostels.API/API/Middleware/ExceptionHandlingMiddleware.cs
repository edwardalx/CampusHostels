using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;


namespace CampusHostels.API.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // Log full exception for internal debugging
            _logger.LogError(ex, "Unhandled exception occurred for request {Method} {Path}",
                             context.Request.Method, context.Request.Path);

            // Return safe response to client
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        string message;
        string? details = null;

        switch (exception)
        {
            case ArgumentException:
                statusCode = StatusCodes.Status400BadRequest;
                message = "Validation failed.";
                details = exception.Message;
                break;

            case UnauthorizedAccessException:
                statusCode = StatusCodes.Status401Unauthorized;
                message = exception.Message;
                break;

            case KeyNotFoundException:
                statusCode = StatusCodes.Status404NotFound;
                message = exception.Message;
                break;

            default:
                statusCode = StatusCodes.Status500InternalServerError;
                message = "An unexpected error occurred. Please try again later.";
                break;
        }

        context.Response.StatusCode = statusCode;

        var response = new
        {
            error = message,
            details = _env.IsDevelopment() ? details : null, // ✅ now works
            timestamp = DateTime.UtcNow
        };

        await context.Response.WriteAsJsonAsync(response);
    }
}
