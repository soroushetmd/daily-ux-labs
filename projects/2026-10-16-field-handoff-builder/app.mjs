import { buildHandoff, renderSummary, validate } from './model.mjs';

const form = document.querySelector('#handoff-form');
const preview = document.querySelector('#preview');
const copyButton = document.querySelector('#copy-json');
const copyStatus = document.querySelector('#copy-status');
const observation = document.querySelector('#observation');
const count = document.querySelector('#count');
let currentHandoff = null;

function values() {
  const data = new FormData(form);
  return { asset:data.get('asset'), location:data.get('location'), observation:data.get('observation'), status:data.get('status'), checks:data.getAll('checks'), nextAction:data.get('nextAction') };
}

function updateCount() { count.textContent = `${observation.value.length} / 800`; }

function showErrors(errors) {
  for (const name of ['asset','observation','status','nextAction']) {
    const element = document.querySelector(`#${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-error`);
    if (element) element.textContent = errors[name] ?? '';
  }
}

function build() {
  const result = validate(values());
  showErrors(result.errors);
  if (!result.valid) { currentHandoff = null; copyButton.disabled = true; preview.innerHTML = '<p class="empty">Fix the labelled fields to build the handoff.</p>'; return false; }
  currentHandoff = buildHandoff(result.data);
  preview.innerHTML = renderSummary(currentHandoff);
  copyButton.disabled = false;
  return true;
}

form.addEventListener('submit', (event) => { event.preventDefault(); if (build()) preview.focus?.(); });
form.addEventListener('input', () => { updateCount(); build(); });
copyButton.addEventListener('click', async () => {
  if (!currentHandoff) return;
  try { await navigator.clipboard.writeText(JSON.stringify(currentHandoff, null, 2)); copyStatus.textContent = 'Structured handoff JSON copied.'; copyButton.textContent = 'Copied'; setTimeout(() => { copyButton.textContent = 'Copy JSON'; }, 1500); }
  catch { copyStatus.textContent = 'Copy failed. Select the preview content manually.'; }
});

updateCount(); build();
