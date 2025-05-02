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
                string configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appsettings.json");
                
                // If the file doesn't exist at the output directory, try the source directory (Server folder)
                if (!File.Exists(configPath))
                {
                    string serverDir = Path.GetDirectoryName(typeof(Program).Assembly.Location);
                    // Go up one directory to get to the Server folder from bin/Debug/net9.0/
                    serverDir = Directory.GetParent(Directory.GetParent(Directory.GetParent(serverDir).FullName).FullName).FullName;
                    configPath = Path.Combine(serverDir, "appsettings.json");
                    
                    // If still not found, try the direct Server subfolder
                    if (!File.Exists(configPath))
                    {
                        configPath = Path.Combine(Directory.GetCurrentDirectory(), "Server", "appsettings.json");
                    }
                }
                
                Console.WriteLine($"Loading configuration from: {configPath}");
                var configJson = File.ReadAllText(configPath);
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