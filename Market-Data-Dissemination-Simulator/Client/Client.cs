using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Grpc.Core;
using Proto;
using System.Threading.Channels;

namespace MarketData.ClientApp
{
    public class Client : Proto.OrderbookService.OrderbookServiceClient, IDisposable
    {
        public Client(ChannelBase channel) : base(channel)
        {
            _streamingTask = StreamAsync(this, _subscriptionChannel.Reader, _shutdownSource);
        }

        private static async Task StreamAsync(Client client, 
            ChannelReader<ClientSubscription> reader, 
            TaskCompletionSource shutdownSource)
        {
            using (var streaming = client.StreamOrderbookUpdates())
            {
                _ = HandleResponsesAsync(streaming.ResponseStream, shutdownSource);
                
                while (true)
                {
                    try
                    {
                        var readTask = reader.WaitToReadAsync();
                        
                        if (readTask.IsCompleted)
                        {
                            _ = readTask.Result;
                        }
                        else
                        {
                            await Task.WhenAny(shutdownSource.Task, readTask.AsTask()).ConfigureAwait(false);
                        }
                        
                        if (shutdownSource.Task.IsCompleted)
                            return;
                        
                        var clientSubscription = await reader.ReadAsync().ConfigureAwait(false);
                        var request = new Proto.Subscription();
                        
                        if (clientSubscription.Subscribe)
                        {
                            request.Subscribe = new Proto.SubscribeRequest();
                            request.Subscribe.Ids.Add(clientSubscription.InstrumentId);
                        }
                        else
                        {
                            request.Unsubscribe = new Proto.UnsubscribeRequest();
                            request.Unsubscribe.Ids.Add(clientSubscription.InstrumentId);
                        }
                        
                        await streaming.RequestStream.WriteAsync(request).ConfigureAwait(false);
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine($"Error in {nameof(StreamAsync)}: {e}");
                    }
                }
            }
        }

        private static async Task HandleResponsesAsync(IAsyncStreamReader<Proto.OrderbookUpdate> responseStream, TaskCompletionSource shutdownSource)
        {
            try
            {
                while (await responseStream.MoveNext().ConfigureAwait(false))
                {
                    var response = responseStream.Current;
                    var update = FromProto(response);
                    
                    if (update.IsSnapshot)
                    {
                        Console.WriteLine($"[{DateTime.Now:O}] Received {(update.IsEmptySnapshot ? "empty" : "")} snapshot for {update.InstrumentId}");
                        
                        if (update.Snapshot.Asks.Count > 0)
                        {
                            Console.WriteLine("---- Asks ----");
                            Console.WriteLine(string.Join("\n", update.Snapshot.Asks));
                        }
                        
                        if (update.Snapshot.Bids.Count > 0)
                        {
                            Console.WriteLine("---- Bids ----");
                            Console.WriteLine(string.Join("\n", update.Snapshot.Bids));
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[{DateTime.Now:O}] Received incremental for {update.InstrumentId}");
                        Console.WriteLine($"\t{update.Incremental.UpdateType} - {update.Incremental.Level}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error receiving updates: {ex.Message}");
            }
        }

        public Task SubscribeAsync(int instrumentId)
        {
            return _subscriptionChannel.Writer.WriteAsync(new ClientSubscription { Subscribe = true, InstrumentId = instrumentId }).AsTask();
        }

        public Task UnsubscribeAsync(int instrumentId)
        {
            return _subscriptionChannel.Writer.WriteAsync(new ClientSubscription { Subscribe = false, InstrumentId = instrumentId }).AsTask();
        }

        public void Dispose()
        {
            _shutdownSource.SetResult();
        }

        private readonly System.Threading.Channels.Channel<ClientSubscription> _subscriptionChannel = System.Threading.Channels.Channel.CreateUnbounded<ClientSubscription>();
        private readonly TaskCompletionSource _shutdownSource = new TaskCompletionSource();
        private readonly Task _streamingTask;

        public static MarketData.Client.OrderbookUpdate FromProto(Proto.OrderbookUpdate response)
        {
            var update = new MarketData.Client.OrderbookUpdate
            {
                InstrumentId = response.InstrumentId
            };

            switch (response.UpdateCase)
            {
                case Proto.OrderbookUpdate.UpdateOneofCase.Snapshot:
                    var snapshotUpdate = new MarketData.Client.OrderbookSnapshotUpdate();
                    
                    snapshotUpdate.IsEmptySnapshot = response.Snapshot.Asks.Count == 0 && response.Snapshot.Bids.Count == 0;
                    
                    // Process asks
                    if (response.Snapshot.Asks.Count > 0)
                    {
                        foreach (var ask in response.Snapshot.Asks)
                        {
                            snapshotUpdate.Asks.Add(new MarketData.Client.OrderbookLevelUpdate
                            {
                                UpdateType = (MarketData.Client.OrderbookLevelUpdateType)ask.UpdateType,
                                Level = new MarketData.Client.OrderbookLevel
                                {
                                    Price = ask.Level.Price,
                                    IsBuy = ask.Level.IsBuy,
                                    Quantity = ask.Level.Quantity
                                }
                            });
                        }
                    }
                    
                    // Process bids
                    if (response.Snapshot.Bids.Count > 0)
                    {
                        foreach (var bid in response.Snapshot.Bids)
                        {
                            snapshotUpdate.Bids.Add(new MarketData.Client.OrderbookLevelUpdate
                            {
                                UpdateType = (MarketData.Client.OrderbookLevelUpdateType)bid.UpdateType,
                                Level = new MarketData.Client.OrderbookLevel
                                {
                                    Price = bid.Level.Price,
                                    IsBuy = bid.Level.IsBuy,
                                    Quantity = bid.Level.Quantity
                                }
                            });
                        }
                    }
                    
                    update.Snapshot = snapshotUpdate;
                    break;
                case Proto.OrderbookUpdate.UpdateOneofCase.Incremental:
                    update.Incremental = new MarketData.Client.OrderbookLevelUpdate
                    {
                        UpdateType = (MarketData.Client.OrderbookLevelUpdateType)response.Incremental.Update.UpdateType,
                        Level = new MarketData.Client.OrderbookLevel
                        {
                            Price = response.Incremental.Update.Level.Price,
                            IsBuy = response.Incremental.Update.Level.IsBuy,
                            Quantity = response.Incremental.Update.Level.Quantity
                        }
                    };
                    break;
            }
            
            return update;
        }
    }

    // Client-side subscription
    internal class ClientSubscription
    {
        public bool Subscribe { get; set; }
        public int InstrumentId { get; set; }
    }
} 