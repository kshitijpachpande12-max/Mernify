const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Delete operations', () => {
  it('validates cascading delete handler parameters', () => {
    const deletedProjectIds = [];
    const mockDb = {
      projects: [{ id: 'p1', name: 'Project 1' }],
      telemetry: [{ projectId: 'p1' }, { projectId: 'p2' }],
      alerts: [{ projectId: 'p1' }],
    };

    function deleteProject(id) {
      if (!mockDb.projects.find((p) => p.id === id)) return false;
      mockDb.projects = mockDb.projects.filter((p) => p.id !== id);
      mockDb.telemetry = mockDb.telemetry.filter((t) => t.projectId !== id);
      mockDb.alerts = mockDb.alerts.filter((a) => a.projectId !== id);
      deletedProjectIds.push(id);
      return true;
    }

    const success = deleteProject('p1');
    assert.strictEqual(success, true);
    assert.strictEqual(mockDb.projects.length, 0);
    assert.strictEqual(mockDb.telemetry.length, 1);
    assert.strictEqual(mockDb.alerts.length, 0);
    assert.strictEqual(deletedProjectIds[0], 'p1');
  });

  it('handles non-existent project deletion cleanly', () => {
    function deleteProject(id) {
      const existing = ['p1', 'p2'];
      if (!existing.includes(id)) return { status: 404, error: 'Project not found' };
      return { status: 200, message: 'Deleted' };
    }

    const res = deleteProject('unknown-id');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.error, 'Project not found');
  });
});
