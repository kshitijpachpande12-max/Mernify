const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

/**
 * Tests for deduplication logic in the ingestion service.
 *
 * We test the eventId-based dedup at the buffer/insertMany level.
 * Since insertMany with ordered:false treats dup key errors as partial
 * success, we simulate that behavior here without a real MongoDB.
 */

describe('Dedup logic', () => {
  // Simulate the buffer-level dedup detection
  function detectDuplicates(events) {
    const seen = new Set();
    const unique = [];
    const duplicates = [];

    for (const ev of events) {
      if (seen.has(ev.eventId)) {
        duplicates.push(ev);
      } else {
        seen.add(ev.eventId);
        unique.push(ev);
      }
    }

    return { unique, duplicates };
  }

  it('detects no duplicates in unique batch', () => {
    const events = [
      { eventId: 'a', type: 'heartbeat' },
      { eventId: 'b', type: 'heartbeat' },
      { eventId: 'c', type: 'heartbeat' },
    ];
    const { unique, duplicates } = detectDuplicates(events);
    assert.equal(unique.length, 3);
    assert.equal(duplicates.length, 0);
  });

  it('detects duplicates within a batch', () => {
    const events = [
      { eventId: 'a', type: 'heartbeat' },
      { eventId: 'b', type: 'heartbeat' },
      { eventId: 'a', type: 'heartbeat' }, // dup
      { eventId: 'c', type: 'heartbeat' },
      { eventId: 'b', type: 'heartbeat' }, // dup
    ];
    const { unique, duplicates } = detectDuplicates(events);
    assert.equal(unique.length, 3);
    assert.equal(duplicates.length, 2);
  });

  it('handles single event', () => {
    const events = [{ eventId: 'only', type: 'metrics' }];
    const { unique, duplicates } = detectDuplicates(events);
    assert.equal(unique.length, 1);
    assert.equal(duplicates.length, 0);
  });

  it('handles all duplicates', () => {
    const events = [
      { eventId: 'x', type: 'heartbeat' },
      { eventId: 'x', type: 'heartbeat' },
      { eventId: 'x', type: 'heartbeat' },
    ];
    const { unique, duplicates } = detectDuplicates(events);
    assert.equal(unique.length, 1);
    assert.equal(duplicates.length, 2);
  });

  it('handles empty batch', () => {
    const { unique, duplicates } = detectDuplicates([]);
    assert.equal(unique.length, 0);
    assert.equal(duplicates.length, 0);
  });

  // Simulate cross-batch dedup (what MongoDB unique index does)
  describe('cross-batch dedup simulation', () => {
    let globalSeen;

    beforeEach(() => {
      globalSeen = new Set();
    });

    function insertBatch(events) {
      let inserted = 0;
      let duplicates = 0;
      for (const ev of events) {
        if (globalSeen.has(ev.eventId)) {
          duplicates++;
        } else {
          globalSeen.add(ev.eventId);
          inserted++;
        }
      }
      return { inserted, duplicates };
    }

    it('detects cross-batch duplicates', () => {
      const batch1 = [
        { eventId: 'a' },
        { eventId: 'b' },
      ];
      const batch2 = [
        { eventId: 'b' }, // dup from batch1
        { eventId: 'c' },
      ];

      const r1 = insertBatch(batch1);
      assert.equal(r1.inserted, 2);
      assert.equal(r1.duplicates, 0);

      const r2 = insertBatch(batch2);
      assert.equal(r2.inserted, 1);
      assert.equal(r2.duplicates, 1);
    });

    it('handles complete overlap between batches', () => {
      const batch1 = [{ eventId: 'a' }, { eventId: 'b' }];
      const batch2 = [{ eventId: 'a' }, { eventId: 'b' }];

      insertBatch(batch1);
      const r2 = insertBatch(batch2);
      assert.equal(r2.inserted, 0);
      assert.equal(r2.duplicates, 2);
    });
  });

  describe('ingestion service live dedup', () => {
    const ingestion = require('../services/ingestion');

    it('accurately counts and rejects duplicates in ingest()', async () => {
      const project = { _id: 'proj_unit_test' };
      const uniqueId = `unit-${Date.now()}`;
      const e1 = {
        eventId: `${uniqueId}-1`,
        projectId: 'p',
        serviceName: 'svc',
        instanceId: 'inst',
        seq: 1,
        ts: Date.now(),
        type: 'heartbeat',
        payload: {},
      };
      const e2 = { ...e1, eventId: `${uniqueId}-2` };
      const e1_dup = { ...e1 };

      const r1 = await ingestion.ingest([e1, e2], project);
      assert.equal(r1.accepted, 2);
      assert.equal(r1.duplicates, 0);

      const r2 = await ingestion.ingest([e1_dup], project);
      assert.equal(r2.accepted, 0);
      assert.equal(r2.duplicates, 1);
    });
  });
});
