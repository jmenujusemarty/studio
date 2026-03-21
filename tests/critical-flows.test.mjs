import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

function createStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear()
  };
}

function loadStudio() {
  const code = fs.readFileSync(path.resolve('app.js'), 'utf8');
  const localStorage = createStorage();
  const context = {
    window: {},
    document: { getElementById: () => null },
    localStorage,
    navigator: {},
    fetch: async () => {
      throw new Error('fetch not mocked');
    },
    DOMParser: class {
      parseFromString() {
        return { querySelectorAll: () => [] };
      }
    },
    URLSearchParams,
    console,
    Date,
    Math,
    JSON,
    setTimeout,
    clearTimeout
  };
  vm.createContext(context);
  new vm.Script(code, { filename: 'app.js' }).runInContext(context);
  return context.window.Studio;
}

test('timeline validator accepts valid rows and rejects malformed ones', () => {
  const Studio = loadStudio();
  const ok = Studio.validateTimelineText('00:00 Úvod\n01:10 Kapitola');
  assert.equal(ok.ok, true);
  assert.equal(ok.lineErrors.length, 0);

  const bad = Studio.validateTimelineText('Úvod bez timestampu\n00:00');
  assert.equal(bad.ok, false);
  assert.ok(bad.lineErrors.length >= 1);
});

test('tool contract runtime validation enforces required fields', () => {
  const Studio = loadStudio();
  const settings = Studio.ensureSettingsShape(Studio.defaultSettings);

  const valid = Studio.validateToolContractPayload(
    'publish-router',
    { channel: {}, payload: {} },
    { jobs: [] },
    settings
  );
  assert.equal(valid.ok, true);

  const invalid = Studio.validateToolContractPayload(
    'publish-router',
    { channel: {} },
    { jobs: [] },
    settings
  );
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.some((e) => e.includes('payload')));
});

test('replaceAllLocalProjects loads projects and keeps active project', () => {
  const Studio = loadStudio();
  const projects = [
    { _projectId: 'a1', episode: 'One', timeline: '00:00 Intro', settings: Studio.defaultSettings },
    { _projectId: 'b2', episode: 'Two', timeline: '00:00 Start', settings: Studio.defaultSettings }
  ];
  const ok = Studio.replaceAllLocalProjects(projects);
  assert.equal(ok, true);
  const list = Studio.listProjects();
  assert.equal(list.length, 2);
  assert.ok(list.some((p) => p._projectId === 'a1'));
});

test('publish queue and audit log helpers work', () => {
  const Studio = loadStudio();
  const payload = { selected: { title: 'Test' } };
  const job = Studio.enqueuePublishJob(payload, new Date().toISOString());
  assert.ok(job.id);
  const queue = Studio.listPublishQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].status, 'queued');

  Studio.updatePublishJobStatus(job.id, 'done');
  const next = Studio.listPublishQueue();
  assert.equal(next[0].status, 'done');

  const audit = Studio.listAuditLog(10);
  assert.ok(audit.length >= 2);
  assert.ok(audit.some((x) => x.message.includes('Job queued')));
});

test('scheduler processes due queued jobs', () => {
  const Studio = loadStudio();
  const past = new Date(Date.now() - 60000).toISOString();
  const future = new Date(Date.now() + 60 * 60000).toISOString();
  const j1 = Studio.enqueuePublishJob({ id: 1 }, past);
  Studio.enqueuePublishJob({ id: 2 }, future);
  const result = Studio.runDuePublishJobs(new Date().toISOString());
  assert.equal(result.processed, 1);
  const q = Studio.listPublishQueue();
  const a = q.find((x) => x.id === j1.id);
  assert.equal(a.status, 'done');
});

test('approval state and channel profile helpers update state', () => {
  const Studio = loadStudio();
  const approval = Studio.setApprovalState('review', 'needs QA');
  assert.equal(approval.state, 'review');
  assert.equal(approval.note, 'needs QA');

  Studio.state.settings.promptOptimizer.tasks.titles.avgScore = 82;
  Studio.state.settings.promptOptimizer.tasks.titles.uses = 10;
  Studio.state.settings.promptOptimizer.tasks.titles.ok = 8;
  const profile = Studio.recomputeChannelProfile();
  assert.equal(profile.tone, 'bold');
  assert.ok(profile.successRate >= 0);
});
