const allowedJourney = new Set(['name', 'start', 'states']);
const allowedState = new Set(['id', 'label', 'kind', 'terminal', 'transitions']);
const allowedTransition = new Set(['to', 'action']);

function rejectUnknown(object, allowed, context) {
  const unknown = Object.keys(object).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${context} has unknown field: ${unknown[0]}`);
}

export function parseJourney(text) {
  const journey = JSON.parse(text);
  rejectUnknown(journey, allowedJourney, 'journey');
  if (!journey.name || !journey.start || !Array.isArray(journey.states) || journey.states.length === 0) {
    throw new Error('name, start, and a non-empty states array are required');
  }
  for (const state of journey.states) {
    rejectUnknown(state, allowedState, `state ${state.id ?? '(missing id)'}`);
    if (!state.id || !state.label) throw new Error('every state needs id and label');
    state.kind ??= 'screen'; state.terminal ??= false; state.transitions ??= [];
    if (!Array.isArray(state.transitions)) throw new Error(`state ${state.id} transitions must be an array`);
    for (const transition of state.transitions) {
      rejectUnknown(transition, allowedTransition, `transition from ${state.id}`);
      if (!transition.to) throw new Error(`transition from ${state.id} needs a target`);
    }
  }
  return journey;
}

export function analyze(journey) {
  const states = new Map();
  for (const state of journey.states) {
    if (states.has(state.id)) throw new Error(`duplicate state id: ${state.id}`);
    states.set(state.id, state);
  }
  if (!states.has(journey.start)) throw new Error(`start state does not exist: ${journey.start}`);
  for (const state of journey.states) for (const transition of state.transitions) {
    if (!states.has(transition.to)) throw new Error(`${state.id} points to missing state: ${transition.to}`);
  }
  const reachable = new Set([journey.start]);
  const queue = [journey.start];
  while (queue.length) {
    const state = states.get(queue.shift());
    for (const { to } of state.transitions) if (!reachable.has(to)) { reachable.add(to); queue.push(to); }
  }
  const findings = [];
  for (const state of journey.states) {
    if (!reachable.has(state.id)) {
      findings.push({ rule: 'Unreachable state', state: state.label, evidence: 'No path from the declared start reaches this state.', suggestion: 'Remove it or connect it to an intentional user path.' });
      continue;
    }
    if (state.transitions.length === 0 && !state.terminal) findings.push({ rule: 'Unmarked dead end', state: state.label, evidence: 'The state has no outgoing transition and is not marked terminal.', suggestion: 'Add a next, back, retry, or support action; otherwise mark it terminal.' });
    if (state.kind === 'error' && !state.terminal && state.transitions.length === 0) findings.push({ rule: 'No error recovery', state: state.label, evidence: 'This error state offers no route onward.', suggestion: 'Provide retry, back, save-and-exit, or assisted support.' });
  }
  findings.sort((a, b) => a.state.localeCompare(b.state) || a.rule.localeCompare(b.rule));
  return { journey, findings, reachable: reachable.size, total: journey.states.length };
}

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function renderReport(report) {
  const cards = report.findings.length ? report.findings.map((finding) => `<article class="card finding"><p class="rule">${escape(finding.rule)}</p><h3>${escape(finding.state)}</h3><p><strong>Evidence:</strong> ${escape(finding.evidence)}</p><p><strong>Next step:</strong> ${escape(finding.suggestion)}</p></article>`).join('') : '<article class="card ok"><h3>No structural signals found</h3><p>All states are reachable, and every non-terminal state has an onward path.</p></article>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(report.journey.name)} — Journey Graph Audit</title><style>body{font:16px/1.55 system-ui;margin:0;color:#172033;background:#f4f6fa}main{max-width:900px;margin:auto;padding:2rem 1rem}header,.card{background:#fff;border:1px solid #d8deea;border-radius:14px;padding:1.25rem;margin-bottom:1rem}h1{margin:.2rem 0}.stats{display:flex;gap:1rem;flex-wrap:wrap}.stat{background:#edf3ff;padding:.7rem 1rem;border-radius:10px}.finding{border-left:5px solid #b54708}.rule{color:#8a3300;font-weight:700}.ok{border-left:5px solid #087a55}:focus{outline:3px solid #145dcc;outline-offset:3px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}</style></head><body><main><header><p>Journey Graph Auditor</p><h1>${escape(report.journey.name)}</h1><p>Structural review of a synthetic product-flow model. This tool supports design review; it does not replace usability testing or accessibility evaluation.</p><div class="stats"><div class="stat"><strong>${report.reachable} / ${report.total}</strong><br>states reachable</div><div class="stat"><strong>${report.findings.length}</strong><br>review signals</div></div></header><section aria-labelledby="findings"><h2 id="findings">Review signals</h2>${cards}</section><footer><p>Created by <strong>Soroush Etemadfar</strong>. Inputs and results in this demo are synthetic.</p></footer></main></body></html>`;
}
