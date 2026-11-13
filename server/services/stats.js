// Stats singleton — tracks ingestion throughput & connection counts

const WINDOW_SEC = 10;

class Stats {
  constructor() {
    this.totalEvents = 0;
    this.dropped = 0;
    this.duplicates = 0;
    this.rejected = 0;
    this.connectedIngest = 0;
    this.connectedDashboards = 0;

    // Sliding window: array of { ts, count } per second
    this._window = [];
  }

  recordEvents(n) {
    this.totalEvents += n;
    const now = Math.floor(Date.now() / 1000);
    const last = this._window[this._window.length - 1];
    if (last && last.ts === now) {
      last.count += n;
    } else {
      this._window.push({ ts: now, count: n });
    }
    this._prune();
  }

  recordDrop(n) {
    this.dropped += n;
  }

  recordDuplicate(n) {
    this.duplicates += n;
  }

  recordReject(n) {
    this.rejected += n;
  }

  setConnectedIngest(n) {
    this.connectedIngest = n;
  }

  setConnectedDashboard(n) {
    this.connectedDashboards = n;
  }

  _prune() {
    const cutoff = Math.floor(Date.now() / 1000) - WINDOW_SEC;
    while (this._window.length && this._window[0].ts < cutoff) {
      this._window.shift();
    }
  }

  get eventsPerSec() {
    this._prune();
    const total = this._window.reduce((sum, w) => sum + w.count, 0);
    return Math.round((total / WINDOW_SEC) * 100) / 100;
  }

  getStats() {
    return {
      eventsPerSec: this.eventsPerSec,
      totalEvents: this.totalEvents,
      connectedIngest: this.connectedIngest,
      connectedDashboards: this.connectedDashboards,
      dropped: this.dropped,
      duplicates: this.duplicates,
      rejected: this.rejected,
      uptimeSec: Math.floor(process.uptime()),
    };
  }
}

// Export singleton
module.exports = new Stats();
