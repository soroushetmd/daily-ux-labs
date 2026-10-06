import test from "node:test";
import assert from "node:assert/strict";
import { compare, exportSnapshot, plans, summarize } from "./model.mjs";

test("clear path has no friction risks", () => {
  assert.deepEqual(summarize(plans[0]), {
    steps: 5, riskCount: 0, channelSwitches: 0, riskKinds: [], review: "Clear"
  });
});

test("high-friction path is marked high priority", () => {
  const result = summarize(plans[1]);
  assert.equal(result.riskCount, 5);
  assert.equal(result.channelSwitches, 1);
  assert.equal(result.review, "High priority");
});

test("helpful alternatives are not counted as risks", () => {
  const result = summarize(plans[2]);
  assert.equal(result.riskCount, 0);
  assert.equal(result.review, "Clear");
});

test("comparison keeps the selected order", () => {
  assert.deepEqual(compare([plans[2], plans[0]]).map(item => item.id), ["pause-first", "clear"]);
});

test("export contains provenance and excludes step copy", () => {
  const output = JSON.parse(exportSnapshot([plans[1]]));
  assert.match(output.disclaimer, /Synthetic/);
  assert.equal(output.generatedBy, "Exit Path Mapper by Soroush Etemadfar");
  assert.equal(output.paths[0].riskCount, 5);
  assert.equal("steps" in output.paths[0], true);
});
