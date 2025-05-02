using System;
using System.Threading;
using System.Threading.Tasks;
using Grpc.Net.Client;
using MarketData.ClientApp;

namespace MarketData.Client
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.Title = "Market Data Client";
            Console.WriteLine("Starting Market Data Client...");

            try
            {
                // Set up gRPC channel
                AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
                var channel = GrpcChannel.ForAddress("http://localhost:14000");
                
                using (var client = new MarketData.ClientApp.Client(channel))
                {
                    var cancellationTokenSource = new CancellationTokenSource();
                    
                    Console.CancelKeyPress += (sender, e) =>
                    {
                        e.Cancel = true;
                        cancellationTokenSource.Cancel();
                    };
                    
                    Console.WriteLine("Client started. Press Ctrl+C to exit.");
                    Console.WriteLine("Available commands:");
                    Console.WriteLine("  sub [instrument_id] - Subscribe to an instrument");
                    Console.WriteLine("  unsub [instrument_id] - Unsubscribe from an instrument");
                    Console.WriteLine("  quit - Exit the client");
                    
                    // Process user commands
                    var processCommandsTask = ProcessUserCommandsAsync(client, cancellationTokenSource.Token);
                    
                    // Keep the client running until Ctrl+C or quit command
                    await Task.WhenAny(processCommandsTask, Task.Delay(Timeout.Infinite, cancellationTokenSource.Token));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex}");
            }
        }

        private static async Task ProcessUserCommandsAsync(MarketData.ClientApp.Client client, CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                Console.Write("> ");
                var command = await Task.Run(() => Console.ReadLine(), cancellationToken);
                
                if (string.IsNullOrWhiteSpace(command))
                    continue;
                
                var parts = command.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                
                if (parts.Length == 0)
                    continue;
                
                switch (parts[0].ToLower())
                {
                    case "sub":
                        if (parts.Length != 2 || !int.TryParse(parts[1], out var subId))
                        {
                            Console.WriteLine("Invalid command. Usage: sub [instrument_id]");
                            continue;
                        }
                        
                        await client.SubscribeAsync(subId);
                        Console.WriteLine($"Subscribed to instrument {subId}");
                        break;
                    
                    case "unsub":
                        if (parts.Length != 2 || !int.TryParse(parts[1], out var unsubId))
                        {
                            Console.WriteLine("Invalid command. Usage: unsub [instrument_id]");
                            continue;
                        }
                        
                        await client.UnsubscribeAsync(unsubId);
                        Console.WriteLine($"Unsubscribed from instrument {unsubId}");
                        break;
                    
                    case "quit":
                    case "exit":
                        Console.WriteLine("Exiting...");
                        return;
                    
                    default:
                        Console.WriteLine("Unknown command. Available commands: sub, unsub, quit");
                        break;
                }
            }
        }
    }
}