using Microsoft.Extensions.Hosting;
namespace CampusHostels.API.Application.BackgroundServices;
public class MyWorker : BackgroundService
{
    private readonly ILogger<MyWorker> _logger;
     public MyWorker( ILogger<MyWorker> logger)
        {
            _logger = logger;
        }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            Console.WriteLine("Running background task...");
            _logger.LogInformation("Testing Background service");

            await Task.Delay(5000, stoppingToken);
        }
    }
}