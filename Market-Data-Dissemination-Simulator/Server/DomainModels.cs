using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace MarketData.Server
{
    public enum OrderbookLevelUpdateType
    {
        Invalid = 0,
        Add = 1,
        Replace = 2,
        Remove = 3
    }

    public class OrderbookLevel
    {
        public int Price { get; set; }
        public bool IsBuy { get; set; }
        public uint Quantity { get; set; }
    }

    public class OrderbookLevelUpdate
    {
        public static readonly OrderbookLevelUpdate Empty = new OrderbookLevelUpdate();

        public OrderbookLevelUpdateType UpdateType { get; set; }
        public OrderbookLevel Level { get; set; }
    }

    public class OrderbookSnapshotUpdate
    {
        public static readonly OrderbookSnapshotUpdate Empty = new OrderbookSnapshotUpdate();

        public OrderbookSnapshotUpdate()
        {
            Bids = new List<OrderbookLevelUpdate>();
            Asks = new List<OrderbookLevelUpdate>();
        }

        public OrderbookSnapshotUpdate(int instrumentId)
        {
            InstrumentId = instrumentId;
            Bids = new List<OrderbookLevelUpdate>();
            Asks = new List<OrderbookLevelUpdate>();
            IsEmptySnapshot = true;
        }

        public OrderbookSnapshotUpdate(int instrumentId, ReadOnlyCollection<OrderbookLevel> bids, ReadOnlyCollection<OrderbookLevel> asks)
        {
            InstrumentId = instrumentId;
            Bids = new List<OrderbookLevelUpdate>();
            Asks = new List<OrderbookLevelUpdate>();

            foreach (var bid in bids)
            {
                Bids.Add(new OrderbookLevelUpdate
                {
                    UpdateType = OrderbookLevelUpdateType.Add,
                    Level = bid
                });
            }

            foreach (var ask in asks)
            {
                Asks.Add(new OrderbookLevelUpdate
                {
                    UpdateType = OrderbookLevelUpdateType.Add,
                    Level = ask
                });
            }
        }

        public int InstrumentId { get; set; }
        public List<OrderbookLevelUpdate> Bids { get; }
        public List<OrderbookLevelUpdate> Asks { get; }
        public bool IsEmptySnapshot { get; set; }
    }

    public class OrderbookIncrementalUpdate
    {
        public OrderbookLevelUpdate Update { get; set; }
    }

    public class OrderbookUpdate
    {
        public OrderbookUpdate()
        {
        }

        public OrderbookUpdate(OrderbookSnapshotUpdate snapshot)
        {
            InstrumentId = snapshot.InstrumentId;
            Snapshot = snapshot;
        }

        public int InstrumentId { get; set; }
        public OrderbookSnapshotUpdate Snapshot { get; set; }
        public OrderbookLevelUpdate Incremental { get; set; }

        public bool IsSnapshot => Snapshot != null;
        public bool IsEmptySnapshot => IsSnapshot && Snapshot.IsEmptySnapshot;
    }
}