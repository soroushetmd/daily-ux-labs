export const riskRules = [
  { id: "certainty", label: "Unsupported certainty", test: text => /guaranteed|always|never fails/i.test(text) },
  { id: "urgency", label: "Pressure language", test: text => /act now|last chance|immediately/i.test(text) },
  { id: "privacy", label: "Sensitive-data request", test: text => /social insurance|sin number|passport number/i.test(text) },
  { id: "blame", label: "Blaming language", test: text => /you failed|your fault/i.test(text) }
];

export function assessCopy(text) {
  const flags = riskRules.filter(rule => rule.test(text)).map(rule => ({ id: rule.id, label: rule.label }));
  return { flags, level: flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "low" };
}

export function createDecision(item, action, editedText = "", note = "") {
  if (!["approve", "edit", "reject"].includes(action)) throw new Error("Unknown review action");
  const finalText = action === "edit" ? editedText.trim() : item.copy;
  if (action === "edit" && !finalText) throw new Error("Edited copy cannot be empty");
  if (action === "reject" && !note.trim()) throw new Error("A rejection note is required");
  return {
    itemId: item.id,
    action,
    originalCopy: item.copy,
    finalCopy: action === "reject" ? null : finalText,
    reviewerNote: note.trim(),
    flagsAtReview: assessCopy(finalText || item.copy).flags.map(flag => flag.id)
  };
}

export function summarize(decisions, total) {
  const counts = { approve: 0, edit: 0, reject: 0 };
  decisions.forEach(decision => counts[decision.action]++);
  return { ...counts, reviewed: decisions.length, remaining: Math.max(0, total - decisions.length) };
}
