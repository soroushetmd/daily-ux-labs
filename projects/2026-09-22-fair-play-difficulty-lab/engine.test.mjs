import test from "node:test";
import assert from "node:assert/strict";
import { MAX_WINDOW, MIN_WINDOW, clamp, nextWindow, scoreHit, summarize } from "./engine.mjs";

test("clamp keeps the response window inside safe bounds", () => {
  assert.equal(clamp(200), MIN_WINDOW);
  assert.equal(clamp(4000), MAX_WINDOW);
});

test("pace becomes more generous after repeated misses", () => {
  const result = nextWindow(1600, [{ hit: false }, { hit: false }, { hit: false }]);
  assert.equal(result.window, 1780);
  assert.match(result.reason, /More time/);
});

test("pace quickens after consistent fast hits", () => {
  const results = [{ hit: true, elapsed: 400 }, { hit: true, elapsed: 500 }, { hit: true, elapsed: 600 }];
  assert.equal(nextWindow(1600, results).window, 1420);
});

test("player lock prevents adaptation", () => {
  const result = nextWindow(1600, [{ hit: false }, { hit: false }], true);
  assert.deepEqual(result, { window: 1600, reason: "Pace locked by player." });
});

test("hit score rewards faster responses without going below base score", () => {
  assert.equal(scoreHit(0, 1000), 200);
  assert.equal(scoreHit(1000, 1000), 100);
  assert.equal(scoreHit(1400, 1000), 100);
});

test("summary separates accuracy, response time, and score", () => {
  const result = summarize([
    { hit: true, elapsed: 400, score: 160 },
    { hit: false, elapsed: 1600, score: 0 },
    { hit: true, elapsed: 600, score: 140 }
  ]);
  assert.deepEqual(result, { hits: 2, accuracy: 67, average: 500, score: 300 });
});
