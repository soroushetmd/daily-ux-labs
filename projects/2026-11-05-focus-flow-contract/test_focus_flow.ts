import test from "node:test";
import assert from "node:assert/strict";
import { audit, renderReport, validateSpec, type PageSpec } from "./focus_flow.ts";

const safe: PageSpec = { title: "Account settings", elements: [
  { id: "skip", role: "skip-link", label: "Skip to settings", region: "page", order: 1, target: "main" },
  { id: "main", role: "region", label: "Settings", region: "page" },
  { id: "name", role: "textbox", label: "Display name", region: "page", order: 2 },
  { id: "save", role: "button", label: "Save changes", region: "page", order: 3 }
]};

test("safe path has no findings", () => assert.deepEqual(audit(safe), []));
test("hidden focus and missing name are blocking", () => { const page = structuredClone(safe); page.elements[2].hidden = true; page.elements[2].label = ""; const f = audit(page); assert.equal(f.filter((x) => x.severity === "blocking").length, 2); });
test("duplicate order is detected", () => { const page = structuredClone(safe); page.elements[3].order = 2; assert.ok(audit(page).some((x) => x.rule === "unique-order")); });
test("broken skip target is detected", () => { const page = structuredClone(safe); page.elements[0].target = "missing"; assert.ok(audit(page).some((x) => x.rule === "skip-target")); });
test("open modal requires containment and valid focus targets", () => { const page = structuredClone(safe); page.modal = { id: "dialog", open: true, initialFocus: "confirm", returnFocus: "save" }; page.elements.push({ id: "confirm", role: "button", label: "Confirm", region: "dialog", order: 4 }); const f = audit(page); assert.ok(f.some((x) => x.rule === "modal-containment")); assert.ok(!f.some((x) => x.rule === "modal-entry")); });
test("schema rejects duplicate ids", () => assert.throws(() => validateSpec({ title: "x", elements: [{ id: "a", role: "button", region: "p" }, { id: "a", role: "link", region: "p" }] }), /Duplicate/));
test("report escapes content and includes semantic table", () => { const page = structuredClone(safe); page.title = "A & <B>"; const html = renderReport(page, []); assert.match(html, /A &amp; &lt;B&gt;/); assert.match(html, /<caption>/); assert.match(html, /scope="col"/); assert.match(html, /Soroush Etemadfar/); });
