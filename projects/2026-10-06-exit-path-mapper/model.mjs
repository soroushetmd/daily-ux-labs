export const plans = [
  {
    id: "clear",
    name: "Clear cancellation",
    description: "A direct, reversible path with consequences explained before confirmation.",
    steps: [
      { label: "Open subscription settings", kind: "neutral" },
      { label: "Choose Cancel subscription", kind: "neutral" },
      { label: "Review access end date and saved-data policy", kind: "helpful" },
      { label: "Confirm cancellation", kind: "neutral" },
      { label: "Receive confirmation and undo window", kind: "helpful" }
    ]
  },
  {
    id: "friction",
    name: "High-friction cancellation",
    description: "A synthetic path containing patterns that deserve design review.",
    steps: [
      { label: "Open subscription settings", kind: "neutral" },
      { label: "Search through an unrelated Help menu", kind: "detour" },
      { label: "Dismiss a full-screen retention offer", kind: "interruption" },
      { label: "Select a mandatory reason", kind: "forced" },
      { label: "Call support during business hours", kind: "channel-switch" },
      { label: "Wait for an email confirmation", kind: "delay" }
    ]
  },
  {
    id: "pause-first",
    name: "Pause-first alternative",
    description: "Offers a pause without hiding the permanent cancellation option.",
    steps: [
      { label: "Open subscription settings", kind: "neutral" },
      { label: "Compare pause and cancel options", kind: "helpful" },
      { label: "Choose Cancel subscription", kind: "neutral" },
      { label: "Review access end date and saved-data policy", kind: "helpful" },
      { label: "Confirm cancellation", kind: "neutral" }
    ]
  }
];

const riskKinds = new Set(["detour", "interruption", "forced", "channel-switch", "delay"]);

export function summarize(plan) {
  const risks = plan.steps.filter(step => riskKinds.has(step.kind));
  const channelSwitches = risks.filter(step => step.kind === "channel-switch").length;
  return {
    steps: plan.steps.length,
    riskCount: risks.length,
    channelSwitches,
    riskKinds: [...new Set(risks.map(step => step.kind))],
    review: risks.length === 0 ? "Clear" : risks.length <= 2 ? "Review" : "High priority"
  };
}

export function compare(selectedPlans) {
  return selectedPlans.map(plan => ({ ...plan, summary: summarize(plan) }));
}

export function exportSnapshot(selectedPlans) {
  return JSON.stringify({
    disclaimer: "Synthetic UX review data; not user research or a legal compliance assessment.",
    generatedBy: "Exit Path Mapper by Soroush Etemadfar",
    paths: compare(selectedPlans).map(({ id, name, summary }) => ({ id, name, ...summary }))
  }, null, 2);
}
