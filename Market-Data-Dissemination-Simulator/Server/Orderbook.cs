using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MarketData.Server
{
    internal class Orderbook : IDisposable
    {
        public Orderbook(Instrument instrument, IOrderbookService service)
        {
            _instrument = instrument;
            _spinTask = GenerateUpdatesAsync(new WeakReference<Orderbook>(this), instrument, service, _disposedSource);
        }

        private static async Task GenerateUpdatesAsync(WeakReference<Orderbook> orderbook,
            Instrument instrument,
            IOrderbookService service,
            TaskCompletionSource disposedSource)
        {
            var random = new Random(DateTime.Now.Millisecond);
            
            while (true)
            {
                if (!orderbook.TryGetTarget(out var model))
                    return;

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(random.NextDouble() * 3));
                    
                    if (disposedSource.Task.IsCompleted)
                        return;

                    OrderbookUpdate update = null;

                    if (random.NextDouble() > 0.90)
                    {
                        var snapshot = model.Refresh(random, instrument);
                        update = new OrderbookUpdate
                        {
                            InstrumentId = instrument.Id,
                            Snapshot = snapshot
                        };
                    }
                    else
                    {
                        var incremental = model.Update(random, instrument);
                        update = new OrderbookUpdate
                        {
                            InstrumentId = instrument.Id,
                            Incremental = incremental
                        };
                    }

                    await service.OnOrderbookUpdateAsync(update).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to perform orderbook update: {ex}");
                }
                finally
                {
                    model = null;
                }
            }
        }

        public OrderbookSnapshotUpdate GetSnapshot()
        {
            lock (_disposedLock)
            {
                if (_disposed)
                    return OrderbookSnapshotUpdate.Empty;

                return new OrderbookSnapshotUpdate(_instrument.Id, _bidLevels.AsReadOnly(), _askLevels.AsReadOnly());
            }
        }

        private OrderbookSnapshotUpdate Refresh(Random random, Instrument instrument)
        {
            lock (_disposedLock)
            {
                if (_disposed)
                    return OrderbookSnapshotUpdate.Empty;

                _bids.Clear();
                _bidLevels.Clear();
                _asks.Clear();
                _askLevels.Clear();

                if (random.NextDouble() > 0.99)
                    return OrderbookSnapshotUpdate.Empty;

                foreach (var i in Enumerable.Range(0, instrument.Specifications.Depth))
                {
                    _ = Update(random, instrument);
                }

                return new OrderbookSnapshotUpdate(_instrument.Id, _bidLevels.AsReadOnly(), _askLevels.AsReadOnly());
            }
        }

        private OrderbookLevelUpdate Update(Random random, Instrument instrument)
        {
            lock (_disposedLock)
            {
                if (_disposed)
                    return OrderbookLevelUpdate.Empty;

                uint GetQuantity() => (uint)random.Next(1, 1000);
                int GetPrice() => random.Next(-100, 100);

                List<OrderbookLevel> levels = null;
                SortedSet<OrderbookLevel> oppositeSortedLevels = null;
                SortedSet<OrderbookLevel> sortedLevels = null;

                var buy = random.Next(0, 2) == 0;
                
                levels = buy ? _bidLevels : _askLevels;
                oppositeSortedLevels = buy ? _asks : _bids;
                sortedLevels = buy ? _bids : _asks;

                var replace = levels.Count == instrument.Specifications.Depth;
                var remove = random.NextDouble() < (levels.Count / (double)(instrument.Specifications.Depth + 1));
                var index = random.Next(0, levels.Count - 1);

                if (remove)
                {
                    return RemoveLevel(index, levels, sortedLevels);
                }
                else if (replace)
                {
                    return ReplaceLevel(index, levels, sortedLevels, GetQuantity());
                }
                else
                {
                    return AddLevel(levels, oppositeSortedLevels, sortedLevels, buy, GetPrice(), GetQuantity());
                }
            }
        }

        private OrderbookLevelUpdate RemoveLevel(int index, List<OrderbookLevel> levels, SortedSet<OrderbookLevel> sortedLevels)
        {
            var level = levels[index];
            levels.RemoveAt(index);
            sortedLevels.Remove(level);
            
            return new OrderbookLevelUpdate
            {
                UpdateType = OrderbookLevelUpdateType.Remove,
                Level = level
            };
        }

        private OrderbookLevelUpdate ReplaceLevel(int index, List<OrderbookLevel> levels, SortedSet<OrderbookLevel> sortedLevels, uint quantity)
        {
            var oldLevel = levels[index];
            sortedLevels.Remove(oldLevel);
            
            var newLevel = new OrderbookLevel
            {
                Price = oldLevel.Price,
                IsBuy = oldLevel.IsBuy,
                Quantity = quantity
            };
            
            levels[index] = newLevel;
            sortedLevels.Add(newLevel);
            
            return new OrderbookLevelUpdate
            {
                UpdateType = OrderbookLevelUpdateType.Replace,
                Level = newLevel
            };
        }

        private OrderbookLevelUpdate AddLevel(List<OrderbookLevel> levels, SortedSet<OrderbookLevel> oppositeSortedLevels, 
            SortedSet<OrderbookLevel> sortedLevels, bool buy, int price, uint quantity)
        {
            // Create a new level
            var level = new OrderbookLevel
            {
                Price = price,
                IsBuy = buy,
                Quantity = quantity
            };
            
            levels.Add(level);
            sortedLevels.Add(level);
            
            return new OrderbookLevelUpdate
            {
                UpdateType = OrderbookLevelUpdateType.Add,
                Level = level
            };
        }

        public void Dispose()
        {
            lock (_disposedLock)
            {
                _disposed = true;
                _disposedSource.SetResult();
            }
        }

        private readonly Instrument _instrument;
        private readonly List<OrderbookLevel> _bidLevels = new List<OrderbookLevel>();
        private readonly List<OrderbookLevel> _askLevels = new List<OrderbookLevel>();
        private readonly SortedSet<OrderbookLevel> _bids = new SortedSet<OrderbookLevel>(new BidComparer());
        private readonly SortedSet<OrderbookLevel> _asks = new SortedSet<OrderbookLevel>(new AskComparer());
        private readonly Task _spinTask;
        private readonly TaskCompletionSource _disposedSource = new TaskCompletionSource();
        private readonly object _disposedLock = new object();
        private bool _disposed;
    }

    // Custom comparers for SortedSet to order bids and asks properly
    internal class BidComparer : IComparer<OrderbookLevel>
    {
        public int Compare(OrderbookLevel x, OrderbookLevel y)
        {
            // Bids are sorted in descending order of price
            return y.Price.CompareTo(x.Price);
        }
    }

    internal class AskComparer : IComparer<OrderbookLevel>
    {
        public int Compare(OrderbookLevel x, OrderbookLevel y)
        {
            // Asks are sorted in ascending order of price
            return x.Price.CompareTo(y.Price);
        }
    }
}