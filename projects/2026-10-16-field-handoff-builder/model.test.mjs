import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHandoff, normalizeInput, renderSummary, validate } from './model.mjs';

const valid = { asset:'Door sensor DS-14', location:'Car 3 · left side', status:'blocked', observation:'Connector does not seat fully.', checks:['Visual inspection','Connector alignment'], nextAction:'Quality review before energizing.' };

test('normalizes whitespace and removes duplicate checks', () => {
  const result = normalizeInput({ ...valid, asset:'  DS-14  ', checks:['Visual inspection','Visual inspection',''] });
  assert.equal(result.asset, 'DS-14');
  assert.deepEqual(result.checks, ['Visual inspection']);
});

test('requires an owner or safe next action for blocked work', () => {
  const result = validate({ ...valid, nextAction:'' });
  assert.equal(result.valid, false);
  assert.match(result.errors.nextAction, /next safe action/);
});

test('allows monitoring with a transparent default next action', () => {
  const handoff = buildHandoff({ ...valid, status:'monitor', nextAction:'' });
  assert.match(handoff.nextAction, /approved procedure/);
});

test('exports a deterministic and minimal object', () => {
  const handoff = buildHandoff(valid);
  assert.deepEqual(Object.keys(handoff), ['schemaVersion','asset','location','status','statusLabel','observation','checksCompleted','nextAction','provenance']);
  assert.equal(handoff.statusLabel, 'Work blocked');
});

test('escapes operator-entered markup in the preview', () => {
  const html = renderSummary(buildHandoff({ ...valid, observation:'<img src=x onerror=alert(1)>' }));
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});

test('rejects an unknown status', () => {
  const result = validate({ ...valid, status:'urgent-ish' });
  assert.equal(result.valid, false);
  assert.match(result.errors.status, /valid status/);
});
