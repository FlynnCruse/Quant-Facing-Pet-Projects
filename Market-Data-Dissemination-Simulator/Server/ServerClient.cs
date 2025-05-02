using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Grpc.Core;

namespace MarketData.Server
{
    internal class ServerClient
    {
        public ServerClient(string host, IServerStreamWriter<Proto.OrderbookUpdate> stream)
        {
            Host = host;
            _stream = stream;
        }

        public string Host { get; }

        public (HashSet<int> AddedSubscriptions, HashSet<int> RemovedSubscriptions) Update(
            HashSet<int> newSubscriptions,
            HashSet<int> unsubscriptions)
        {
            lock (_subscriptionsLock)
            {
                // Calculate the difference between current subscriptions and new ones
                var added = new HashSet<int>(newSubscriptions);
                added.ExceptWith(_subscriptions.Keys);

                // Calculate unsubscriptions
                var removed = new HashSet<int>(unsubscriptions);
                
                // Update subscriptions
                foreach (var subscription in added)
                {
                    _subscriptions[subscription] = true;
                }

                foreach (var unsubscription in removed)
                {
                    _subscriptions.Remove(unsubscription);
                }

                return (added, removed);
            }
        }

        public async Task SendAsync(OrderbookUpdate update, CancellationToken token)
        {
            using (await _subscriptionsLock.LockAsync().ConfigureAwait(false))
            {
                if (!_subscriptions.TryGetValue(update.InstrumentId, out var snapshot) && !update.IsEmptySnapshot)
                    return;

                if (snapshot && !update.IsSnapshot)
                    return;

                if (snapshot && update.IsSnapshot)
                    _subscriptions[update.InstrumentId] = false;

                Proto.OrderbookUpdate response = new Proto.OrderbookUpdate()
                {
                    InstrumentId = update.InstrumentId,
                };

                if (update.IsSnapshot)
                {
                    response.Snapshot = new Proto.OrderbookSnapshotUpdate();
                    response.Snapshot.Asks.AddRange(update.Snapshot.Asks.Select(ProtoAdapter.ToSnapshotLevel));
                    response.Snapshot.Bids.AddRange(update.Snapshot.Bids.Select(ProtoAdapter.ToSnapshotLevel));
                }
                else
                {
                    response.Incremental = new Proto.OrderbookIncrementalUpdate();
                    response.Incremental.Update = ProtoAdapter.ToIncrementalLevel(update.Incremental);
                }

                await _stream.WriteAsync(response, token).ConfigureAwait(false);
            }
        }

        private readonly IServerStreamWriter<Proto.OrderbookUpdate> _stream;
        private readonly Dictionary<int, bool> _subscriptions = new Dictionary<int, bool>();
        private readonly AsyncLock _subscriptionsLock = new AsyncLock();
    }

    // Helper for converting domain models to protobuf models
    internal static class ProtoAdapter
    {
        public static Proto.OrderbookLevelUpdate ToSnapshotLevel(OrderbookLevelUpdate update)
        {
            return new Proto.OrderbookLevelUpdate
            {
                UpdateType = (Proto.OrderbookLevelUpdateType)update.UpdateType,
                Level = new Proto.OrderbookLevel
                {
                    Price = update.Level.Price,
                    IsBuy = update.Level.IsBuy,
                    Quantity = update.Level.Quantity
                }
            };
        }

        public static Proto.OrderbookLevelUpdate ToIncrementalLevel(OrderbookLevelUpdate update)
        {
            return new Proto.OrderbookLevelUpdate
            {
                UpdateType = (Proto.OrderbookLevelUpdateType)update.UpdateType,
                Level = new Proto.OrderbookLevel
                {
                    Price = update.Level.Price,
                    IsBuy = update.Level.IsBuy,
                    Quantity = update.Level.Quantity
                }
            };
        }

        public static OrderbookUpdate FromProto(Proto.OrderbookUpdate response)
        {
            var update = new OrderbookUpdate
            {
                InstrumentId = response.InstrumentId
            };

            switch (response.UpdateCase)
            {
                case Proto.OrderbookUpdate.UpdateOneofCase.Snapshot:
                    var snapshotUpdate = new OrderbookSnapshotUpdate();
                    
                    // Process asks
                    if (response.Snapshot.Asks.Any())
                    {
                        foreach (var ask in response.Snapshot.Asks)
                        {
                            snapshotUpdate.Asks.Add(new OrderbookLevelUpdate
                            {
                                UpdateType = (OrderbookLevelUpdateType)ask.UpdateType,
                                Level = new OrderbookLevel
                                {
                                    Price = ask.Level.Price,
                                    IsBuy = ask.Level.IsBuy,
                                    Quantity = ask.Level.Quantity
                                }
                            });
                        }
                    }
                    
                    // Process bids
                    if (response.Snapshot.Bids.Any())
                    {
                        foreach (var bid in response.Snapshot.Bids)
                        {
                            snapshotUpdate.Bids.Add(new OrderbookLevelUpdate
                            {
                                UpdateType = (OrderbookLevelUpdateType)bid.UpdateType,
                                Level = new OrderbookLevel
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
                    update.Incremental = new OrderbookLevelUpdate
                    {
                        UpdateType = (OrderbookLevelUpdateType)response.Incremental.Update.UpdateType,
                        Level = new OrderbookLevel
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

    // Helper class for async locks
    internal class AsyncLock
    {
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);
        private readonly Task<IDisposable> _releaser;

        public AsyncLock()
        {
            _releaser = Task.FromResult((IDisposable)new Releaser(this));
        }

        public Task<IDisposable> LockAsync()
        {
            var wait = _semaphore.WaitAsync();
            return wait.IsCompleted ?
                _releaser :
                wait.ContinueWith((_, state) => (IDisposable)state,
                    _releaser.Result, CancellationToken.None,
                    TaskContinuationOptions.ExecuteSynchronously, TaskScheduler.Default);
        }

        private class Releaser : IDisposable
        {
            private readonly AsyncLock _toRelease;

            internal Releaser(AsyncLock toRelease)
            {
                _toRelease = toRelease;
            }

            public void Dispose()
            {
                _toRelease._semaphore.Release();
            }
        }
    }
}