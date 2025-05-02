using System.Collections.Generic;

namespace MarketData.Server
{
    public class ServerConfiguration
    {
        public int Port { get; set; }
        public List<Instrument> Instruments { get; set; }
    }

    public class Instrument
    {
        public int Id { get; set; }
        public string Symbol { get; set; }
        public InstrumentSpecifications Specifications { get; set; }
    }

    public class InstrumentSpecifications
    {
        public int Depth { get; set; }
    }
}