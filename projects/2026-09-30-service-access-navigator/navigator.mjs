const channels = [
  { id: "online", name: "Online appointment", wait: "Demo: next available today", weights: [3, 0, 2, 1] },
  { id: "phone", name: "Phone support", wait: "Demo: 10–20 minute queue", weights: [2, 2, -1, 3] },
  { id: "office", name: "In-person service centre", wait: "Demo: next available in 2 days", weights: [0, -2, -2, 2] }
];

export function recommend(needs) {
  return channels.map(channel => score(channel, needs)).sort((a, b) => b.score - a.score);
}

function score(channel, needs) {
  let value = 5;
  const reasons = [];
  const cautions = [];
  const [urgentWeight, mobilityWeight, digitalWeight, languageWeight] = channel.weights;
  if (needs.urgent) {
    value += urgentWeight;
    (urgentWeight > 0 ? reasons : cautions).push(urgentWeight > 0 ? "Better fit for time-sensitive tasks" : "May not fit a time-sensitive task");
  }
  if (needs.mobility) {
    value += mobilityWeight;
    (mobilityWeight >= 0 ? reasons : cautions).push(mobilityWeight >= 0 ? "Avoids or reduces travel" : "Requires travel to a service centre");
  }
  if (!needs.digital) {
    value -= digitalWeight;
    (digitalWeight > 0 ? cautions : reasons).push(digitalWeight > 0 ? "Requires confidence with an online form" : "Offers help without completing an online form alone");
  } else if (digitalWeight > 0) {
    value += digitalWeight;
    reasons.push("Matches comfort with online tasks");
  }
  if (needs.language) {
    value += languageWeight;
    (languageWeight > 1 ? reasons : cautions).push(languageWeight > 1 ? "Can request interpreter support in this demo" : "Language support may need advance arrangement");
  }
  if (!reasons.length) reasons.push("Available as a general service channel");
  return { id: channel.id, name: channel.name, score: Math.max(0, value), wait: channel.wait, reasons, cautions };
}

export function parseNeeds(params) {
  return Object.fromEntries(["urgent", "mobility", "digital", "language"].map(key => [key, params.get(key) === "true"]));
}
