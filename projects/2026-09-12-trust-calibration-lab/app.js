const scenarios = [
  {
    context: "Navigation assistant",
    title: "Take a route that saves three minutes?",
    detail: "The assistant recommends a new route. Traffic data was refreshed 30 seconds ago, the route uses familiar roads, and no safety alerts are active.",
    signals: [["AI confidence", "94%"], ["Data freshness", "30 sec"], ["Evidence", "Strong"]],
    answer: "accept",
    rationale: "Accepting is proportionate here: the decision is reversible, the evidence is fresh, and the cost of a mistake is low."
  },
  {
    context: "Health assistant",
    title: "Double a medication dose immediately?",
    detail: "The assistant suggests doubling a dose but has no access to the patient's medical history and does not cite a clinician or verified guideline.",
    signals: [["AI confidence", "88%"], ["Patient context", "Missing"], ["Potential harm", "High"]],
    answer: "reject",
    rationale: "A confident interface cannot compensate for missing clinical context. High-impact medical actions require qualified human review."
  },
  {
    context: "Research assistant",
    title: "Use this claim in a literature review?",
    detail: "The summary cites three sources, but the newest is eight years old and the topic changes quickly. The original papers are available to open.",
    signals: [["AI confidence", "71%"], ["Source age", "8 years"], ["Traceability", "Available"]],
    answer: "verify",
    rationale: "Verification preserves speed without outsourcing judgment. Open the sources and check whether newer evidence changes the claim."
  },
  {
    context: "Accessibility checker",
    title: "Approve the interface as fully accessible?",
    detail: "The automated audit reports perfect colour contrast, but keyboard navigation, screen-reader labels, zoom, and error recovery were not tested.",
    signals: [["Audit score", "100%"], ["Test coverage", "Partial"], ["Human review", "None"]],
    answer: "verify",
    rationale: "Automated checks catch only part of accessibility. Verify with keyboard, assistive technology, zoom, and task-based testing."
  },
  {
    context: "Analytics assistant",
    title: "Roll out a redesign based on an 18% lift?",
    detail: "The assistant reports an 18% conversion increase, but the experiment includes only 23 sessions and ran for a single afternoon.",
    signals: [["Reported lift", "+18%"], ["Sample", "23 sessions"], ["Duration", "4 hours"]],
    answer: "verify",
    rationale: "The direction is promising, but the sample and duration are too limited for a rollout decision. Gather more representative evidence."
  }
];

const els = {
  intro: document.querySelector("#intro"),
  experiment: document.querySelector("#experiment"),
  results: document.querySelector("#results"),
  start: document.querySelector("#start-button"),
  form: document.querySelector("#decision-form"),
  feedback: document.querySelector("#feedback"),
  next: document.querySelector("#next-button"),
  restart: document.querySelector("#restart-button"),
  confidence: document.querySelector("#confidence"),
  confidenceOutput: document.querySelector("#confidence-output"),
  progressLabel: document.querySelector("#progress-label"),
  progressBar: document.querySelector("[role='progressbar']"),
  progressFill: document.querySelector("#progress-fill"),
  signalGrid: document.querySelector("#signal-grid"),
  context: document.querySelector("#scenario-context"),
  title: document.querySelector("#scenario-title"),
  detail: document.querySelector("#scenario-detail"),
  error: document.querySelector("#form-error")
};

let current = 0;
let responses = [];

function showScenario() {
  const scenario = scenarios[current];
  const number = current + 1;
  els.progressLabel.textContent = `Scenario ${number} of ${scenarios.length}`;
  els.progressBar.setAttribute("aria-valuenow", number);
  els.progressFill.style.width = `${(number / scenarios.length) * 100}%`;
  els.signalGrid.innerHTML = scenario.signals
    .map(([label, value]) => `<div class="signal"><small>${label}</small><strong>${value}</strong></div>`)
    .join("");
  els.context.textContent = scenario.context;
  els.title.textContent = scenario.title;
  els.detail.textContent = scenario.detail;
  els.form.reset();
  els.confidence.value = 70;
  els.confidenceOutput.value = "70%";
  els.error.textContent = "";
  els.feedback.hidden = true;
  els.form.hidden = false;
  els.title.focus?.();
}

function showResults() {
  const correctCount = responses.filter(response => response.correct).length;
  const accuracy = Math.round((correctCount / scenarios.length) * 100);
  const averageConfidence = Math.round(responses.reduce((sum, response) => sum + response.confidence, 0) / responses.length);
  const gap = averageConfidence - accuracy;
  const absoluteGap = Math.abs(gap);

  let title = "Well calibrated.";
  let summary = "Your confidence generally matched the quality of your decisions.";
  if (gap > 15) {
    title = "Confidence ran ahead of accuracy.";
    summary = "You made some strong calls, but expressed more certainty than the outcomes supported.";
  } else if (gap < -15) {
    title = "Your decisions were stronger than you felt.";
    summary = "You were cautious even when your judgment was accurate—a sign of under-confidence rather than poor reasoning.";
  }

  document.querySelector("#results-title").textContent = title;
  document.querySelector("#results-summary").textContent = summary;
  document.querySelector("#accuracy-score").textContent = `${accuracy}%`;
  document.querySelector("#confidence-score").textContent = `${averageConfidence}%`;
  document.querySelector("#gap-score").textContent = `${absoluteGap} pts`;
  document.querySelector("#design-takeaway").textContent = gap > 15
    ? "Interfaces should slow users down when consequences are high, evidence is weak, or confidence cues could encourage over-reliance."
    : "Good AI experiences make evidence, uncertainty, reversibility, and potential harm visible so users can calibrate reliance—not merely trust more.";

  els.experiment.hidden = true;
  els.results.hidden = false;
  document.querySelector("#results-title").focus?.();
}

els.start.addEventListener("click", () => {
  els.intro.hidden = true;
  els.experiment.hidden = false;
  showScenario();
});

els.confidence.addEventListener("input", () => {
  els.confidenceOutput.value = `${els.confidence.value}%`;
});

els.form.addEventListener("submit", event => {
  event.preventDefault();
  const selected = new FormData(els.form).get("decision");
  if (!selected) {
    els.error.textContent = "Choose Accept, Verify, or Reject before continuing.";
    return;
  }

  const scenario = scenarios[current];
  const correct = selected === scenario.answer;
  responses.push({ decision: selected, confidence: Number(els.confidence.value), correct });
  document.querySelector("#feedback-label").textContent = correct ? "Calibrated decision" : "Consider another signal";
  document.querySelector("#feedback-title").textContent = correct ? "Good call." : `Recommended action: ${scenario.answer}.`;
  document.querySelector("#feedback-copy").textContent = scenario.rationale;
  els.form.hidden = true;
  els.feedback.hidden = false;
  els.next.textContent = current === scenarios.length - 1 ? "See my results →" : "Next scenario →";
  els.next.focus();
});

els.next.addEventListener("click", () => {
  if (current === scenarios.length - 1) {
    showResults();
    return;
  }
  current += 1;
  showScenario();
});

els.restart.addEventListener("click", () => {
  current = 0;
  responses = [];
  els.results.hidden = true;
  els.intro.hidden = false;
  els.start.focus();
});
