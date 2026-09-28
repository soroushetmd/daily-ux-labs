import { assessCopy, createDecision, summarize } from "./review-engine.mjs";

const items = [
  { id: "onboarding", surface: "Account onboarding", context: "Explain why identity details are needed.", copy: "Enter your passport number immediately to guarantee account approval." },
  { id: "empty-state", surface: "Empty state", context: "Guide a new teammate toward their first project.", copy: "No projects yet. Create one or join a workspace to get started." },
  { id: "error", surface: "Upload error", context: "Help someone recover after a file upload fails.", copy: "Your upload failed. It is your fault—use a smaller file." },
  { id: "reminder", surface: "Trial reminder", context: "Mention that a trial ends in three days.", copy: "Last chance! Upgrade now or you will never access your work again." }
];

let index = 0;
const decisions = [];
const $ = selector => document.querySelector(selector);

function render() {
  const item = items[index];
  const summary = summarize(decisions, items.length);
  $("#progress").textContent = `${summary.reviewed} of ${items.length} reviewed`;
  $("#progress-bar").value = summary.reviewed;
  $("#surface").textContent = item?.surface ?? "Queue complete";
  $("#context").textContent = item?.context ?? "Export the review log for a transparent handoff.";
  $("#copy").value = item?.copy ?? "";
  $("#note").value = "";
  $("#review-form").hidden = !item;
  $("#complete").hidden = Boolean(item);
  $("#summary").textContent = `${summary.approve} approved · ${summary.edit} edited · ${summary.reject} rejected`;
  if (item) renderRisk(item.copy);
}

function renderRisk(text) {
  const assessment = assessCopy(text);
  $("#risk").className = `risk risk--${assessment.level}`;
  $("#risk-level").textContent = `${assessment.level} risk`;
  $("#flags").replaceChildren(...(assessment.flags.length
    ? assessment.flags.map(flag => Object.assign(document.createElement("li"), { textContent: flag.label }))
    : [Object.assign(document.createElement("li"), { textContent: "No rule-based flags detected. Human review is still required." })]));
}

$("#copy").addEventListener("input", event => renderRisk(event.target.value));
$("#review-form").addEventListener("submit", event => {
  event.preventDefault();
  const action = event.submitter.value;
  try {
    decisions.push(createDecision(items[index], action, $("#copy").value, $("#note").value));
    index++;
    $("#message").textContent = `Decision saved: ${action}.`;
    render();
  } catch (error) {
    $("#message").textContent = error.message;
    if (action === "reject") $("#note").focus(); else $("#copy").focus();
  }
});

$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ prototype: true, decisions }, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "ai-copy-review-log.json" });
  link.click();
  URL.revokeObjectURL(link.href);
});

render();
