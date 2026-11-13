'use strict';

/**
 * Bounded event buffer.
 * Collects telemetry envelopes and hands them off on flush().
 */
function createBuffer(maxSize) {
  maxSize = maxSize || 10000;
  let buf = [];

  return {
    add(envelope) {
      buf.push(envelope);
      // Drop oldest when over capacity
      while (buf.length > maxSize) {
        buf.shift();
      }
    },

    flush() {
      if (buf.length === 0) return [];
      const out = buf;
      buf = [];
      return out;
    },

    size() {
      return buf.length;
    },
  };
}

module.exports = { createBuffer };
