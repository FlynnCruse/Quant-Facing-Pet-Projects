using System.Collections.Generic;

namespace MarketData.Client
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

        public override string ToString()
        {
            return $"OrderbookLevel {{ Price = {Price}, IsBuy = {IsBuy}, Quantity = {Quantity} }}";
        }
    }

    public class OrderbookLevelUpdate
    {
        public OrderbookLevelUpdateType UpdateType { get; set; }
        public OrderbookLevel Level { get; set; }

        public override string ToString()
        {
            return $"OrderbookLevelUpdate {{ {UpdateType} - {Level} }}";
        }
    }

    public class OrderbookSnapshotUpdate
    {
        public OrderbookSnapshotUpdate()
        {
            Bids = new List<OrderbookLevelUpdate>();
            Asks = new List<OrderbookLevelUpdate>();
        }

        public List<OrderbookLevelUpdate> Bids { get; }
        public List<OrderbookLevelUpdate> Asks { get; }
        public bool IsEmptySnapshot { get; set; }
    }

    public class OrderbookUpdate
    {
        public int InstrumentId { get; set; }
        public OrderbookSnapshotUpdate Snapshot { get; set; }
        public OrderbookLevelUpdate Incremental { get; set; }

        public bool IsSnapshot => Snapshot != null;
        public bool IsEmptySnapshot => IsSnapshot && Snapshot.IsEmptySnapshot;
    }
}