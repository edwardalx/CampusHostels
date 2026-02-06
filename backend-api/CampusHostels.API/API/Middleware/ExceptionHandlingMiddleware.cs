using System.Net;
using System.Text.Json;

namespace CampusHostels.API.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
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

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode = (int)HttpStatusCode.InternalServerError;
        string userMessage = "An unexpected error occurred. Please try again later.";
        string? details = null;

        // Handle safe exceptions for the client
        if (exception is ArgumentException || exception is InvalidOperationException)
        {
            statusCode = (int)HttpStatusCode.BadRequest; // 400 for client errors
            userMessage = "Validation failed.";
            details = exception.Message; // safe message
        }

        context.Response.StatusCode = statusCode;

        var response = new
        {
            error = userMessage,
            details = details,
            timestamp = DateTime.UtcNow
        };

        return context.Response.WriteAsJsonAsync(response);
    }
}
