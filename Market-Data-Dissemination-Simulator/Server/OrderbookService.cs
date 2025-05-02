using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Grpc.Core;
using Proto;

namespace MarketData.Server
{
    // Interface for the OrderbookManager
    internal interface IOrderbookManager
    {
        OrderbookSnapshotUpdate GetSnapshot(int instrumentId);
    }

    // Interface for the OrderbookService
    internal interface IOrderbookService
    {
        Task StartAsync();
        Task OnOrderbookUpdateAsync(OrderbookUpdate update);
        void Dispose();
    }

    // Implementation of the OrderbookService
    internal class OrderbookService : Proto.OrderbookService.OrderbookServiceBase, IOrderbookService, IDisposable
    {
        public OrderbookService(int port, IOrderbookManager orderbookManager)
        {
            _orderbookManager = orderbookManager;
            _server = new Grpc.Core.Server
            {
                Services = { Proto.OrderbookService.BindService(this) },
                Ports = { new Grpc.Core.ServerPort("localhost", port, Grpc.Core.ServerCredentials.Insecure) }
            };
        }

        public Task StartAsync()
        {
            _server.Start();
            return Task.CompletedTask;
        }

        public async Task OnOrderbookUpdateAsync(OrderbookUpdate update)
        {
            List<ServerClient> clients;
            
            lock (_clientsLock)
            {
                clients = _clients.Values.ToList();
            }

            var tasks = clients.Select(c => c.SendAsync(update, default));
            await Task.WhenAll(tasks);
        }

        public override async Task StreamOrderbookUpdates(
            IAsyncStreamReader<Proto.Subscription> requestStream,
            IServerStreamWriter<Proto.OrderbookUpdate> responseStream,
            ServerCallContext context)
        {
            try
            {
                var client = new ServerClient(context.Peer, responseStream);
                
                lock (_clientsLock)
                {
                    _clients.Add(client.Host, client);
                }
                
                Console.WriteLine($"Added client {client.Host}");
                
                try
                {
                    var streamingCompletionSource = new TaskCompletionSource();
                    using (var streamingCompleteTokenSource = CancellationTokenSource.CreateLinkedTokenSource(context.CancellationToken))
                    using (var streamingCompleteRegistration = streamingCompleteTokenSource.Token.Register(() => streamingCompletionSource.SetResult()))
                    using (var readClientSubscriptionRequestsTask = ReadClientSubscriptionRequestsAsync(requestStream, client, streamingCompleteTokenSource.Token))
                    {
                        await Task.WhenAny(streamingCompletionSource.Task, readClientSubscriptionRequestsTask).ConfigureAwait(false);
                        
                        if (streamingCompletionSource.Task.IsCompleted)
                            return;
                            
                        await readClientSubscriptionRequestsTask.ConfigureAwait(false);
                    }
                }
                finally
                {
                    lock (_clientsLock)
                    {
                        _clients.Remove(client.Host);
                    }
                    
                    Console.WriteLine($"Removed client {client.Host}");
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error in {nameof(StreamOrderbookUpdates)}: {e}");
            }
        }

        private async Task ReadClientSubscriptionRequestsAsync(
            IAsyncStreamReader<Proto.Subscription> requestStream,
            ServerClient client,
            CancellationToken token)
        {
            while (await requestStream.MoveNext(token).ConfigureAwait(false))
            {
                await ProcessSubscribeRequestAsync(requestStream.Current, client, token);
            }
        }

        private async Task ProcessSubscribeRequestAsync(
            Proto.Subscription current,
            ServerClient client,
            CancellationToken token)
        {
            var (addedSubscriptions, removedSubscriptions) = client.Update(
                current.Subscribe?.Ids.ToHashSet() ?? new HashSet<int>(),
                current.Unsubscribe?.Ids.ToHashSet() ?? new HashSet<int>());

            if (addedSubscriptions.Any())
                Console.WriteLine($"{client.Host} subscribed to {string.Join(",", addedSubscriptions)}");

            if (removedSubscriptions.Any())
                Console.WriteLine($"{client.Host} unsubscribed from {string.Join(",", removedSubscriptions)}");

            var removedOrderbooks = new List<OrderbookSnapshotUpdate>();
            var addedOrderbooks = new List<OrderbookSnapshotUpdate>();

            foreach (var removedSubscription in removedSubscriptions)
                removedOrderbooks.Add(new OrderbookSnapshotUpdate(removedSubscription));

            foreach (var addedSubscription in addedSubscriptions)
                addedOrderbooks.Add(_orderbookManager.GetSnapshot(addedSubscription));

            var removedOrderbookSendTask = Task.WhenAll(removedOrderbooks.Select(i => client.SendAsync(new OrderbookUpdate(i), default)));
            var addedOrderbookSendTask = Task.WhenAll(addedOrderbooks.Select(i => client.SendAsync(new OrderbookUpdate(i), default)));

            await Task.WhenAll(removedOrderbookSendTask, addedOrderbookSendTask).ConfigureAwait(false);
        }

        public void Dispose()
        {
            _server.ShutdownAsync().Wait();
        }

        private readonly Grpc.Core.Server _server;
        private readonly IOrderbookManager _orderbookManager;
        private readonly Dictionary<string, ServerClient> _clients = new Dictionary<string, ServerClient>();
        private readonly object _clientsLock = new object();
    }
}
