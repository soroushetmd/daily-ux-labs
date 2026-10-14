import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, parseJourney, renderReport } from './auditor.mjs';

const parse = (states, start = 'a', name = 'Demo') => parseJourney(JSON.stringify({ name, start, states }));

test('finds a dead end and unreachable state', () => {
  const report = analyze(parse([{ id:'a', label:'Start', transitions:[{to:'b'}] }, { id:'b', label:'Stuck' }, { id:'c', label:'Hidden', terminal:true }]));
  assert.equal(report.reachable, 2); assert.equal(report.findings.length, 2);
});

test('gives an error without recovery two explicit signals', () => {
  const report = analyze(parse([{ id:'a', label:'Failed', kind:'error' }]));
  assert.deepEqual(report.findings.map(({rule}) => rule).sort(), ['No error recovery', 'Unmarked dead end']);
});

test('accepts a healthy journey', () => {
  const report = analyze(parse([{ id:'a', label:'Start', transitions:[{to:'b'}] }, { id:'b', label:'Done', terminal:true }]));
  assert.equal(report.findings.length, 0);
});

test('rejects a missing transition target and unknown fields', () => {
  assert.throws(() => analyze(parse([{ id:'a', label:'Start', transitions:[{to:'missing'}] }])), /missing state/);
  assert.throws(() => parseJourney('{"name":"Demo","start":"a","states":[],"score":10}'), /unknown field/);
});

test('escapes input and includes provenance and limitation', () => {
  const report = analyze(parse([{ id:'a', label:'Start', terminal:true }], 'a', '<script>alert(1)</script>'));
  const html = renderReport(report);
  assert.doesNotMatch(html, /<script>alert/); assert.match(html, /Soroush Etemadfar/); assert.match(html, /does not replace usability testing/);
});
