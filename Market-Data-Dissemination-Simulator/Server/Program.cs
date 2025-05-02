using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using MarketData.Server;

namespace MarketData.Server
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.Title = "Market Data Server";
            Console.WriteLine("Starting Market Data Server...");

            try
            {
                // Read configuration from appsettings.json
                var configJson = File.ReadAllText("appsettings.json");
                var config = JsonSerializer.Deserialize<ServerConfiguration>(configJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                Console.WriteLine($"Loaded configuration with {config.Instruments.Count} instruments.");
                
                using (var server = new Server(config))
                {
                    var cancellationTokenSource = new CancellationTokenSource();
                    
                    Console.CancelKeyPress += (sender, e) =>
                    {
                        e.Cancel = true;
                        cancellationTokenSource.Cancel();
                    };
                    
                    Console.WriteLine($"Server started on port {config.Port}. Press Ctrl+C to exit.");
                    
                    await server.RunAsync(cancellationTokenSource.Token);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex}");
            }
        }
    }
}