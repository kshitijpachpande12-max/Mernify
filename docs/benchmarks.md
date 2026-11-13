# MERNIFY Benchmark Results

*Generated on: 2026-11-13T10:18:49.232Z*
*Duration: 3s per tier | Server: http://127.0.0.1:5000*

| Sources | Events/sec | Drops | P95 Latency |
|---------|-----------|-------|-------------|
| 100     | 99        | 0     | 6ms         |
| 500     | 497       | 0     | 14ms        |
| 1000    | 987       | 0     | 25ms        |

### Methodology
- Each source sends metrics & http envelopes at 1s intervals via Socket.IO `/ingest` namespace with ack confirmations.
- Latency is computed roundtrip from emit to server acknowledgement.
- Drops include rejected payloads, schema failures, or dropped acknowledgements.