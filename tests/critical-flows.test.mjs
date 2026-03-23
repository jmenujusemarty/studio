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

test('marketplace template installs into prompt settings', () => {
  const Studio = loadStudio();
  const before = Studio.state.settings.prompts.titles;
  const ok = Studio.installMarketplaceTemplate('tpl-cz-viral-titles');
  assert.equal(ok, true);
  const after = Studio.state.settings.prompts.titles;
  assert.notEqual(after, before);
  assert.ok(after.includes('agresivnější hook'));
});

test('clip pipeline builder returns hooks/scripts/hashtags', () => {
  const Studio = loadStudio();
  const out = Studio.buildClipPipelineFromClips([
    { start: '00:12', hook: 'Největší fail týdne', reason: 'Krátký kontext' }
  ]);
  assert.equal(Array.isArray(out), true);
  assert.equal(out.length, 1);
  assert.ok(out[0].script.includes('Největší fail týdne'));
  assert.ok(Array.isArray(out[0].hashtags));
  assert.ok(out[0].hashtags.length > 0);
});

test('A/B planner imports results and selects winner by CTR', () => {
  const Studio = loadStudio();
  Studio.setAbPlannerPlan([{ id: 'var-a', label: 'A' }, { id: 'var-b', label: 'B' }], 'plan');
  const planner = Studio.importAbPlannerResults([
    { variantId: 'var-a', impressions: 1000, clicks: 50 },
    { variantId: 'var-b', impressions: 1000, clicks: 70 }
  ]);
  assert.equal(planner.results.length, 2);
  assert.equal(planner.selectedWinner, 'var-b');
});

test('export payloads include youtube and spotify objects', () => {
  const Studio = loadStudio();
  Studio.state.episode = 'Test Episode';
  Studio.state.smartTitles = [{ title: 'Výherní název' }];
  Studio.state.descGenerated = { youtube_description: 'YT', spotify_html: '<p>SP</p>' };
  const out = Studio.exportChannelPayloads();
  assert.ok(out.youtube);
  assert.ok(out.spotify);
  assert.equal(out.youtube.title, 'Výherní název');
});

test('team approval policy and votes gate publishing', () => {
  const Studio = loadStudio();
  Studio.state.settings.team.actor = 'lead-editor';
  Studio.setApprovalPolicy('lead-editor', 2);
  assert.equal(Studio.canPublishNow(), false);

  Studio.addApprovalVote('lead-editor', 'approve', 'looks good');
  assert.equal(Studio.canPublishNow(), false);
  Studio.addApprovalVote('producer', 'approve', 'approved');
  assert.equal(Studio.canPublishNow(), true);
});

test('publish router creates jobs by channel mode', () => {
  const Studio = loadStudio();
  const outputs = {
    title: 'T',
    episode: 'E',
    youtube_description: 'Y',
    spotify_html: '<p>S</p>',
    timeline: ['00:00 Intro']
  };
  const both = Studio.routePublishJobs({ mode: 'both', publishMode: 'manual' }, outputs);
  assert.equal(both.length, 2);
  assert.ok(both.some((j) => j.target === 'youtube'));
  assert.ok(both.some((j) => j.target === 'spotify'));

  const yt = Studio.routePublishJobs({ mode: 'youtube', publishMode: 'manual' }, outputs);
  assert.equal(yt.length, 1);
  assert.equal(yt[0].target, 'youtube');
});

test('performance ingestion updates optimizer and channel profile', () => {
  const Studio = loadStudio();
  const out = Studio.ingestPerformanceMetrics({
    source: 'youtube-studio',
    ctr: 7.1,
    retention: 44.2,
    titleScore: 80
  });
  assert.equal(out.ok, true);
  assert.ok(out.perfScore > 0);
  assert.ok(Studio.state.settings.promptOptimizer.tasks.titles.uses >= 1);
  assert.ok(typeof Studio.state.channelProfile.tone === 'string');
});

test('variant comparator returns winner and scores', () => {
  const Studio = loadStudio();
  const titleCmp = Studio.compareVariants('title', 'Největší drama týdne?', 'Update týdne');
  assert.equal(titleCmp.ok, true);
  assert.ok(typeof titleCmp.left.score === 'number');
  assert.ok(['left', 'right', 'tie'].includes(titleCmp.winner));

  const descCmp = Studio.compareVariants('description', 'Silný hook\nDalší řádek\nCTA', 'Krátký popis');
  assert.equal(descCmp.ok, true);
  assert.ok(typeof descCmp.right.score === 'number');
});

test('settings shape includes queue api integration url', () => {
  const Studio = loadStudio();
  const s = Studio.ensureSettingsShape(Studio.defaultSettings);
  assert.equal(typeof s.integrations.queueApiUrl, 'string');
  assert.ok(s.integrations.queueApiUrl.includes('queue.php'));
});

test('titles engine contract validator catches invalid payload', () => {
  const Studio = loadStudio();
  const s = Studio.ensureSettingsShape(Studio.defaultSettings);
  const bad = Studio.validateToolContractPayload(
    'titles-engine',
    { transcript: 'x' },
    { titles: [] },
    s
  );
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => e.includes('trends')));
});

test('auto AB plan builds variants from smart titles', () => {
  const Studio = loadStudio();
  Studio.state.smartTitles = [
    { title: 'Title A' },
    { title: 'Title B' },
    { title: 'Title C' }
  ];
  const plan = Studio.buildAbPlanFromCandidates({ maxVariants: 3, cadenceHours: 12 });
  assert.ok(Array.isArray(plan.variants));
  assert.equal(plan.variants.length, 3);
  assert.equal(plan.variants[0].label, 'Title A');
});

test('custom marketplace templates can be added and removed', () => {
  const Studio = loadStudio();
  const add = Studio.addCustomMarketplaceTemplate({
    id: 'tpl-custom-x',
    name: 'Custom X',
    type: 'titles',
    prompt: 'Use custom logic'
  });
  assert.equal(add, true);
  const list = Studio.getMarketplaceTemplates();
  assert.ok(list.some((x) => x.id === 'tpl-custom-x'));

  Studio.installMarketplaceTemplate('tpl-custom-x');
  assert.ok((Studio.state.settings.marketplace.installed || []).includes('tpl-custom-x'));
  Studio.uninstallMarketplaceTemplate('tpl-custom-x');
  assert.ok(!(Studio.state.settings.marketplace.installed || []).includes('tpl-custom-x'));

  const removed = Studio.removeCustomMarketplaceTemplate('tpl-custom-x');
  assert.equal(removed, true);
  const listAfter = Studio.getMarketplaceTemplates();
  assert.ok(!listAfter.some((x) => x.id === 'tpl-custom-x'));
});
