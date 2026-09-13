const routes = [
  {
    id: "A",
    name: "Direct 7",
    description: "One bus · central stops",
    minutes: 31,
    walking: 620,
    transfers: 0,
    stepFree: true,
    elevator: true,
    lowSensory: false
  },
  {
    id: "B",
    name: "Green Link",
    description: "Bus + rail · accessible interchange",
    minutes: 36,
    walking: 280,
    transfers: 1,
    stepFree: true,
    elevator: true,
    lowSensory: true
  },
  {
    id: "C",
    name: "Local 14",
    description: "Two local buses · quieter stops",
    minutes: 43,
    walking: 390,
    transfers: 1,
    stepFree: false,
    elevator: false,
    lowSensory: true
  }
];

const labels = {
  stepFree: "Step-free",
  lowWalking: "Under 450 m walking",
  elevator: "Elevator confirmed",
  lowSensory: "Lower sensory load"
};

const routeList = document.querySelector("#route-list");
const summary = document.querySelector("#result-summary");
const liveUpdate = document.querySelector("#live-update");
const checkboxes = [...document.querySelectorAll("#needs-form input")];
const resetButton = document.querySelector("#reset-button");

function meets(route, need) {
  if (need === "lowWalking") return route.walking <= 450;
  return Boolean(route[need]);
}

function scoreRoute(route, selectedNeeds) {
  const matches = selectedNeeds.filter(need => meets(route, need)).length;
  return matches * 100 - route.minutes;
}

function badge(text, state = "") {
  return `<span class="badge ${state}">${text}</span>`;
}

function render() {
  const selectedNeeds = checkboxes.filter(input => input.checked).map(input => input.value);
  const ranked = routes
    .map(route => ({ ...route, score: scoreRoute(route, selectedNeeds) }))
    .sort((a, b) => b.score - a.score);

  routeList.innerHTML = ranked.map((route, index) => {
    const preferenceBadges = selectedNeeds.map(need => badge(
      `${meets(route, need) ? "✓" : "!"} ${labels[need]}`,
      meets(route, need) ? "match" : "miss"
    ));
    const standardBadges = [
      badge(`${route.walking} m walking`),
      badge(`${route.transfers} ${route.transfers === 1 ? "transfer" : "transfers"}`)
    ];
    const misses = selectedNeeds.filter(need => !meets(route, need));
    const explanation = selectedNeeds.length === 0
      ? "Routes are ordered by travel time. Add a trip need to compare accessibility trade-offs."
      : misses.length === 0
        ? "Matches every selected trip need."
        : `Trade-off: does not meet ${misses.map(need => labels[need].toLowerCase()).join(" and ")}.`;

    return `
      <article class="route-card ${index === 0 ? "best" : ""}">
        ${index === 0 ? `<span class="best-label">${selectedNeeds.length ? "Best match for your needs" : "Fastest sample route"}</span>` : ""}
        <div class="route-top">
          <div class="route-name"><span class="route-icon" aria-hidden="true">${route.id}</span><div><h3>${route.name}</h3><p>${route.description}</p></div></div>
          <div class="time">${route.minutes}<small>minutes</small></div>
        </div>
        <div class="badges">${[...preferenceBadges, ...standardBadges].join("")}</div>
        <p class="explanation">${explanation}</p>
      </article>`;
  }).join("");

  summary.textContent = selectedNeeds.length
    ? `Prioritising ${selectedNeeds.length} selected ${selectedNeeds.length === 1 ? "need" : "needs"}. All routes remain visible.`
    : "Showing all sample routes.";
  liveUpdate.textContent = `${ranked[0].name} is now the top route. ${summary.textContent}`;
}

checkboxes.forEach(input => input.addEventListener("change", render));
resetButton.addEventListener("click", () => {
  checkboxes.forEach(input => { input.checked = false; });
  render();
  checkboxes[0].focus();
});

render();
