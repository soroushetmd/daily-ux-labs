import assert from "node:assert/strict";
import test from "node:test";
import { parseNeeds, recommend } from "./navigator.mjs";

test("online leads for urgent, digitally comfortable users", () => {
  assert.equal(recommend({ urgent: true, mobility: false, digital: true, language: false })[0].id, "online");
});

test("phone leads when language and non-digital support matter", () => {
  assert.equal(recommend({ urgent: false, mobility: true, digital: false, language: true })[0].id, "phone");
});

test("all alternatives remain visible", () => {
  assert.equal(recommend({ urgent: false, mobility: false, digital: false, language: false }).length, 3);
});

test("query values are parsed strictly", () => {
  assert.deepEqual(parseNeeds(new URLSearchParams("urgent=true&digital=yes")), { urgent: true, mobility: false, digital: false, language: false });
});
