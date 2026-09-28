import assert from "node:assert/strict";
import test from "node:test";
import { assessCopy, createDecision, summarize } from "./review-engine.mjs";

const item = { id: "a", copy: "A clear, neutral message." };

test("flags multiple risky patterns", () => {
  const result = assessCopy("Act now. Approval is guaranteed.");
  assert.equal(result.level, "high");
  assert.deepEqual(result.flags.map(flag => flag.id), ["certainty", "urgency"]);
});

test("keeps neutral copy low risk", () => assert.equal(assessCopy(item.copy).level, "low"));

test("records an edited decision", () => {
  const decision = createDecision(item, "edit", "A clearer message.", "Reduced certainty.");
  assert.equal(decision.finalCopy, "A clearer message.");
  assert.equal(decision.action, "edit");
});

test("requires rationale for rejection", () => assert.throws(() => createDecision(item, "reject"), /required/));

test("summarizes the queue", () => {
  const result = summarize([{ action: "approve" }, { action: "edit" }], 4);
  assert.deepEqual(result, { approve: 1, edit: 1, reject: 0, reviewed: 2, remaining: 2 });
});
