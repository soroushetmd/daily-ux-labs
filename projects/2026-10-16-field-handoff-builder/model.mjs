export const MAX_NOTE_LENGTH = 800;

const labels = {
  monitor: 'Monitor',
  blocked: 'Work blocked',
  safety: 'Safety concern',
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function normalizeInput(input) {
  return {
    asset: String(input.asset ?? '').trim(),
    location: String(input.location ?? '').trim(),
    status: String(input.status ?? 'monitor'),
    observation: String(input.observation ?? '').trim(),
    checks: [...new Set((input.checks ?? []).map((item) => String(item).trim()).filter(Boolean))],
    nextAction: String(input.nextAction ?? '').trim(),
  };
}

export function validate(input) {
  const data = normalizeInput(input);
  const errors = {};
  if (!data.asset) errors.asset = 'Add a component or asset reference.';
  if (!data.observation) errors.observation = 'Describe what was observed.';
  if (data.observation.length > MAX_NOTE_LENGTH) errors.observation = `Keep the observation under ${MAX_NOTE_LENGTH} characters.`;
  if (!Object.hasOwn(labels, data.status)) errors.status = 'Choose a valid status.';
  if (data.status !== 'monitor' && !data.nextAction) errors.nextAction = 'Add the next safe action or owner for blocked and safety items.';
  return { data, errors, valid: Object.keys(errors).length === 0 };
}

export function buildHandoff(input) {
  const result = validate(input);
  if (!result.valid) throw new Error('Cannot build an invalid handoff.');
  const { data } = result;
  return {
    schemaVersion: 1,
    asset: data.asset,
    location: data.location || null,
    status: data.status,
    statusLabel: labels[data.status],
    observation: data.observation,
    checksCompleted: data.checks,
    nextAction: data.nextAction || 'Continue monitoring under the approved procedure.',
    provenance: 'Structured by Field Handoff Builder; content entered by the operator.',
  };
}

export function renderSummary(handoff) {
  const checks = handoff.checksCompleted.length
    ? `<ul>${handoff.checksCompleted.map((check) => `<li>${escapeHtml(check)}</li>`).join('')}</ul>`
    : '<p>No completed checks recorded.</p>';
  return `<article class="summary-card"><p class="status status--${escapeHtml(handoff.status)}">${escapeHtml(handoff.statusLabel)}</p><h3>${escapeHtml(handoff.asset)}</h3>${handoff.location ? `<p><strong>Location:</strong> ${escapeHtml(handoff.location)}</p>` : ''}<h4>Observed</h4><p>${escapeHtml(handoff.observation)}</p><h4>Checks completed</h4>${checks}<h4>Next action</h4><p>${escapeHtml(handoff.nextAction)}</p><p class="provenance">${escapeHtml(handoff.provenance)}</p></article>`;
}
