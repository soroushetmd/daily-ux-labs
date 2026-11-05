import { readFileSync, writeFileSync } from "node:fs";

export type ElementSpec = {
  id: string; role: string; label?: string; region: string; order?: number;
  target?: string; hidden?: boolean; disabled?: boolean; inert?: boolean;
};
export type ModalSpec = { id: string; open: boolean; initialFocus: string; returnFocus: string };
export type PageSpec = { title: string; elements: ElementSpec[]; modal?: ModalSpec };
export type Finding = { severity: "blocking" | "review"; rule: string; element: string; message: string };

const interactiveRoles = new Set(["link", "button", "textbox", "checkbox", "radio", "combobox", "dialog"]);

export function validateSpec(value: unknown): PageSpec {
  if (!value || typeof value !== "object") throw new TypeError("Root must be an object.");
  const page = value as Partial<PageSpec>;
  if (typeof page.title !== "string" || !page.title.trim()) throw new TypeError("title must be a non-empty string.");
  if (!Array.isArray(page.elements) || page.elements.length === 0) throw new TypeError("elements must be a non-empty array.");
  const ids = new Set<string>();
  for (const [index, item] of page.elements.entries()) {
    if (!item || typeof item !== "object") throw new TypeError(`elements[${index}] must be an object.`);
    const element = item as ElementSpec;
    for (const key of ["id", "role", "region"] as const) if (typeof element[key] !== "string" || !element[key]) throw new TypeError(`elements[${index}].${key} is required.`);
    if (ids.has(element.id)) throw new TypeError(`Duplicate element id: ${element.id}`);
    ids.add(element.id);
    if (element.order !== undefined && (!Number.isInteger(element.order) || element.order < 0)) throw new TypeError(`${element.id}.order must be a non-negative integer.`);
  }
  return page as PageSpec;
}

export function audit(page: PageSpec): Finding[] {
  const findings: Finding[] = [];
  const byId = new Map(page.elements.map((element) => [element.id, element]));
  const ordered = page.elements.filter((element) => element.order !== undefined && !element.disabled);
  const orderOwners = new Map<number, string[]>();
  for (const element of ordered) {
    const owners = orderOwners.get(element.order!) ?? [];
    owners.push(element.id); orderOwners.set(element.order!, owners);
    if (element.hidden) findings.push({ severity: "blocking", rule: "hidden-focus", element: element.id, message: "Hidden content remains in the declared focus path." });
    if (interactiveRoles.has(element.role) && !element.label?.trim()) findings.push({ severity: "blocking", rule: "accessible-name", element: element.id, message: "Interactive element has no accessible label." });
  }
  for (const [order, owners] of orderOwners) if (owners.length > 1) findings.push({ severity: "blocking", rule: "unique-order", element: owners.join(", "), message: `Focus order ${order} is assigned to multiple elements.` });

  const sequence = [...new Set(ordered.map((element) => element.order!))].sort((a, b) => a - b);
  sequence.forEach((value, index) => { if (value !== index + 1) findings.push({ severity: "review", rule: "order-gap", element: String(value), message: `Focus sequence jumps from ${index ? sequence[index - 1] : 0} to ${value}; verify the intended DOM order.` }); });

  const skips = page.elements.filter((element) => element.role === "skip-link");
  if (skips.length === 0) findings.push({ severity: "review", rule: "skip-link", element: "page", message: "No skip link is declared." });
  for (const skip of skips) {
    if (!skip.target || !byId.has(skip.target)) findings.push({ severity: "blocking", rule: "skip-target", element: skip.id, message: "Skip link target does not exist." });
    if (skip.order !== 1) findings.push({ severity: "review", rule: "skip-position", element: skip.id, message: "Skip link is not first in the declared focus order." });
  }

  if (page.modal?.open) {
    const modal = page.modal;
    const initial = byId.get(modal.initialFocus), returned = byId.get(modal.returnFocus);
    if (!initial || initial.region !== modal.id || initial.disabled || initial.hidden) findings.push({ severity: "blocking", rule: "modal-entry", element: modal.initialFocus, message: "Initial modal focus is missing, unavailable, or outside the modal." });
    if (!returned || returned.disabled || returned.hidden) findings.push({ severity: "blocking", rule: "modal-return", element: modal.returnFocus, message: "Return-focus target is missing or unavailable." });
    for (const element of ordered) if (element.region !== modal.id && !element.inert) findings.push({ severity: "blocking", rule: "modal-containment", element: element.id, message: "Background focus target is not marked inert while the modal is open." });
  }
  return findings;
}

function escapeHtml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }

export function renderReport(page: PageSpec, findings: Finding[]): string {
  const counts = { blocking: findings.filter((f) => f.severity === "blocking").length, review: findings.filter((f) => f.severity === "review").length };
  const rows = findings.length ? findings.map((f) => `<tr><td><span class="pill ${f.severity}">${f.severity}</span></td><td><code>${escapeHtml(f.rule)}</code></td><td><code>${escapeHtml(f.element)}</code></td><td>${escapeHtml(f.message)}</td></tr>`).join("") : `<tr><td colspan="4">No automated findings. Manual keyboard testing is still required.</td></tr>`;
  const path = page.elements.filter((e) => e.order !== undefined && !e.disabled).sort((a, b) => a.order! - b.order!).map((e) => `<li><span>${e.order}</span><strong>${escapeHtml(e.label || e.id)}</strong><small>${escapeHtml(e.role)} · ${escapeHtml(e.region)}</small></li>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Focus Flow Contract · ${escapeHtml(page.title)}</title><style>:root{--ink:#15171c;--muted:#55606d;--line:#cbd5e1;--paper:#f5f7fa;--blue:#164e63;--red:#8a1c2b;--amber:#704d00}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,sans-serif}main{width:min(1100px,calc(100% - 2rem));margin:auto;padding:3rem 0 5rem}h1{font-size:clamp(2.4rem,7vw,5rem);line-height:.95;letter-spacing:-.04em;margin:.4rem 0}.lede{max-width:68ch;color:var(--muted)}.summary{display:grid;grid-template-columns:repeat(2,minmax(140px,220px));gap:.75rem;margin:2rem 0}.metric{background:white;border:1px solid var(--line);border-radius:14px;padding:1rem}.metric strong{display:block;font-size:2rem}.path{display:flex;gap:.65rem;overflow:auto;list-style:none;padding:0 0 .75rem}.path li{min-width:180px;background:white;border:1px solid var(--line);border-radius:12px;padding:.8rem}.path span{display:grid;place-items:center;width:1.7rem;height:1.7rem;border-radius:50%;background:var(--blue);color:white}.path strong,.path small{display:block;margin-top:.45rem}.path small{color:var(--muted)}.table-wrap{overflow:auto;background:white;border:1px solid var(--line);border-radius:14px}table{border-collapse:collapse;width:100%;min-width:760px}caption{text-align:left;font-weight:750;padding:1rem}th,td{text-align:left;vertical-align:top;padding:.8rem;border-top:1px solid var(--line)}th{background:#dff3f7}.pill{font-size:.72rem;font-weight:800;text-transform:uppercase;padding:.2rem .45rem;border-radius:99px}.blocking{color:var(--red);background:#f7dce0}.review{color:var(--amber);background:#faebbc}aside{margin-top:1.5rem;border-left:5px solid var(--blue);background:white;padding:1rem}footer{margin-top:2rem;color:var(--muted)}:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}</style></head><body><main><header><p>Accessibility engineering · design-system handoff</p><h1>Focus Flow Contract</h1><p class="lede">An inspectable keyboard-path review for <strong>${escapeHtml(page.title)}</strong>. It checks declared structure without pretending to replace browser, screen-reader, or user testing.</p></header><section aria-labelledby="summary"><h2 id="summary">Audit summary</h2><div class="summary"><div class="metric"><strong>${counts.blocking}</strong>Blocking</div><div class="metric"><strong>${counts.review}</strong>Review</div></div></section><section aria-labelledby="path"><h2 id="path">Declared focus path</h2><ol class="path">${path}</ol></section><section aria-labelledby="findings"><h2 id="findings">Findings</h2><div class="table-wrap"><table><caption>Automated structural findings</caption><thead><tr><th scope="col">Severity</th><th scope="col">Rule</th><th scope="col">Element</th><th scope="col">Reason</th></tr></thead><tbody>${rows}</tbody></table></div></section><aside><strong>Prototype boundary</strong><p>Static declarations cannot verify actual DOM order, focus visibility, keyboard event handling, screen-reader announcements, or focus restoration in a real browser. Treat this report as an early contract check.</p></aside><footer>Designed and engineered by <strong>Soroush Etemadfar</strong>.</footer></main></body></html>`;
}

function main(args: string[]): number {
  if (args.length !== 2) { console.error("Usage: node focus_flow.ts INPUT.json OUTPUT.html"); return 2; }
  try {
    const page = validateSpec(JSON.parse(readFileSync(args[0], "utf8")));
    const findings = audit(page);
    writeFileSync(args[1], renderReport(page, findings));
    console.log(`Wrote ${findings.length} findings to ${args[1]}`);
    return findings.some((f) => f.severity === "blocking") ? 1 : 0;
  } catch (error) { console.error(error instanceof Error ? error.message : error); return 2; }
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = main(process.argv.slice(2));
