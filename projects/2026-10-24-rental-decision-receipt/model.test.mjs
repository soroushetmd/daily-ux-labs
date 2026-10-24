import test from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_LISTINGS, buildReceipt, compare, summarize } from "./model.mjs";

test("separates monthly and upfront costs", () => {
  const result = summarize(SAMPLE_LISTINGS[0]);
  assert.equal(result.recurringExtras, 270);
  assert.equal(result.monthlyTotal, 2410);
  assert.equal(result.upfrontTotal, 2190);
});

test("does not treat undocumented claims as verified", () => {
  const result = summarize(SAMPLE_LISTINGS[0]);
  assert.equal(result.verifiedClaims, 1);
  assert.equal(result.reviewClaims, 1);
});

test("computes difference from the lowest monthly total", () => {
  const results = compare(SAMPLE_LISTINGS.slice(0, 2));
  assert.deepEqual(results.map(item => item.difference), [195, 0]);
});

test("receipt is deterministic with an injected timestamp", () => {
  const receipt = buildReceipt(SAMPLE_LISTINGS.slice(0, 2), "2026-10-24T13:00:00.000Z");
  assert.equal(receipt.created, "2026-10-24T13:00:00.000Z");
  assert.equal(receipt.listings.length, 2);
  assert.match(receipt.disclaimer, /Synthetic/);
});

test("rejects negative and non-numeric costs", () => {
  assert.throws(() => summarize({ rent: -1 }), /non-negative rent/);
  assert.throws(() => summarize({ rent: 1, monthly: { fee: "unknown" } }), /Costs/);
});
