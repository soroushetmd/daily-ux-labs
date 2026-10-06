import { compare, exportSnapshot, plans } from "./model.mjs";

const optionRoot = document.querySelector("#path-options");
const pathRoot = document.querySelector("#paths");
const summaryRoot = document.querySelector("#summary");
const status = document.querySelector("#copy-status");

const labels = {
  detour: "Detour",
  interruption: "Interruption",
  forced: "Forced input",
  "channel-switch": "Channel switch",
  delay: "Delay",
  helpful: "Helpful context",
  neutral: "Neutral action"
};

for (const [index, plan] of plans.entries()) {
  const label = document.createElement("label");
  label.className = "check-card";
  label.innerHTML = `<input type="checkbox" value="${plan.id}" ${index < 2 ? "checked" : ""}>
    <span><strong>${plan.name}</strong><small>${plan.description}</small></span>`;
  optionRoot.append(label);
}

function selectedPlans() {
  const ids = [...optionRoot.querySelectorAll("input:checked")].map(input => input.value);
  return plans.filter(plan => ids.includes(plan.id));
}

function render() {
  const compared = compare(selectedPlans());
  const totalRisks = compared.reduce((sum, plan) => sum + plan.summary.riskCount, 0);
  summaryRoot.textContent = compared.length
    ? `${compared.length} path${compared.length === 1 ? "" : "s"} selected · ${totalRisks} review signal${totalRisks === 1 ? "" : "s"}`
    : "Select at least one path to begin.";
  pathRoot.replaceChildren();

  for (const plan of compared) {
    const article = document.createElement("article");
    article.className = "path-card";
    article.innerHTML = `<div class="card-heading"><div><h3>${plan.name}</h3><p>${plan.description}</p></div>
      <span class="review review--${plan.summary.review.toLowerCase().replace(" ", "-")}">${plan.summary.review}</span></div>
      <dl class="metrics"><div><dt>Steps</dt><dd>${plan.summary.steps}</dd></div><div><dt>Review signals</dt><dd>${plan.summary.riskCount}</dd></div><div><dt>Channel switches</dt><dd>${plan.summary.channelSwitches}</dd></div></dl>
      <ol>${plan.steps.map(step => `<li class="step step--${step.kind}"><span>${step.label}</span><small>${labels[step.kind]}</small></li>`).join("")}</ol>`;
    pathRoot.append(article);
  }
}

optionRoot.addEventListener("change", render);
document.querySelector("#export-button").addEventListener("click", async () => {
  const selected = selectedPlans();
  if (!selected.length) {
    status.textContent = "Select at least one path before exporting.";
    return;
  }
  try {
    await navigator.clipboard.writeText(exportSnapshot(selected));
    status.textContent = "Review snapshot copied to clipboard.";
  } catch {
    status.textContent = "Clipboard access is unavailable in this browser.";
  }
});

render();
