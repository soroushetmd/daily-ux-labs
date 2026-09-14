const findings = [
  {
    id: "fees",
    title: "Fees appear too late",
    stage: "Checkout",
    observed: 5,
    impact: 5,
    confidence: "High",
    evidence: "Observed in 5 of 6 synthetic sessions",
    next: "Prototype an earlier total-cost preview and test comprehension."
  },
  {
    id: "delivery",
    title: "Delivery window is vague",
    stage: "Decide",
    observed: 4,
    impact: 3,
    confidence: "Medium",
    evidence: "Observed in 4 of 6 synthetic sessions",
    next: "Compare a date range with a confidence-labelled estimate."
  },
  {
    id: "allergens",
    title: "Allergen details are buried",
    stage: "Discover",
    observed: 2,
    impact: 5,
    confidence: "Medium",
    evidence: "Observed in 2 of 6 synthetic sessions",
    next: "Move safety-critical details beside the primary decision."
  },
  {
    id: "promo",
    title: "Promo field distracts",
    stage: "Checkout",
    observed: 4,
    impact: 2,
    confidence: "High",
    evidence: "Observed in 4 of 6 synthetic sessions",
    next: "Test a collapsed promo control and monitor task completion."
  },
  {
    id: "comparison",
    title: "Options are hard to compare",
    stage: "Decide",
    observed: 3,
    impact: 4,
    confidence: "Medium",
    evidence: "Observed in 3 of 6 synthetic sessions",
    next: "Align the attributes that most affect the choice."
  },
  {
    id: "labels",
    title: "Category labels feel unclear",
    stage: "Discover",
    observed: 2,
    impact: 2,
    confidence: "Low",
    evidence: "Observed in 2 of 6 synthetic sessions",
    next: "Gather more evidence before changing the information architecture."
  }
];

const svg = document.querySelector("#priority-map");
const stageFilter = document.querySelector("#stage-filter");
const confidenceToggle = document.querySelector("#confidence-toggle");
const resultCount = document.querySelector("#result-count");
const detailContent = document.querySelector("#detail-content");
const tableBody = document.querySelector("#findings-table");
const liveUpdate = document.querySelector("#live-update");
const viewButtons = [...document.querySelectorAll(".view-button")];
const chartView = document.querySelector("#chart-view");
const tableView = document.querySelector("#table-view");

const plot = { left: 84, right: 710, top: 45, bottom: 400 };
const x = value => plot.left + ((value - 1) / 4) * (plot.right - plot.left);
const y = value => plot.bottom - ((value - 1) / 4) * (plot.bottom - plot.top);

function baseChart() {
  const grid = [1, 2, 3, 4, 5].map(value => `
    <line class="grid-line" x1="${x(value)}" x2="${x(value)}" y1="${plot.top}" y2="${plot.bottom}"></line>
    <line class="grid-line" x1="${plot.left}" x2="${plot.right}" y1="${y(value)}" y2="${y(value)}"></line>
    <text class="axis-label" x="${x(value)}" y="425" text-anchor="middle">${value}</text>
    <text class="axis-label" x="60" y="${y(value) + 4}" text-anchor="middle">${value}</text>`).join("");

  return `
    <rect class="region" x="${x(3.5)}" y="${y(5)}" width="${plot.right - x(3.5)}" height="${y(3.5) - y(5)}" rx="12"></rect>
    <text class="region-label" x="${x(3.5) + 15}" y="${y(5) + 24}">Investigate first</text>
    ${grid}
    <line class="axis" x1="${plot.left}" x2="${plot.right}" y1="${plot.bottom}" y2="${plot.bottom}"></line>
    <line class="axis" x1="${plot.left}" x2="${plot.left}" y1="${plot.top}" y2="${plot.bottom}"></line>
    <text class="axis-label" x="${(plot.left + plot.right) / 2}" y="458" text-anchor="middle">Observed frequency →</text>
    <text class="axis-label" x="17" y="${(plot.top + plot.bottom) / 2}" text-anchor="middle" transform="rotate(-90 17 ${(plot.top + plot.bottom) / 2})">Task impact →</text>`;
}

function visibleFindings() {
  return findings.filter(finding => stageFilter.value === "all" || finding.stage === stageFilter.value);
}

function selectFinding(finding, announce = true) {
  document.querySelectorAll(".point").forEach(point => point.classList.toggle("selected", point.dataset.id === finding.id));
  detailContent.innerHTML = `
    <h3 id="detail-title">${finding.title}</h3>
    <p>${finding.evidence}. Demo values are illustrative, not research claims.</p>
    <dl>
      <div><dt>Stage</dt><dd>${finding.stage}</dd></div>
      <div><dt>Confidence</dt><dd>${finding.confidence}</dd></div>
      <div><dt>Frequency</dt><dd>${finding.observed} / 6</dd></div>
      <div><dt>Impact</dt><dd>${finding.impact} / 5</dd></div>
    </dl>
    <p class="next-step"><strong>Suggested next step</strong>${finding.next}</p>`;
  if (announce) liveUpdate.textContent = `${finding.title} selected. Impact ${finding.impact} of 5, observed ${finding.observed} of 6.`;
}

function renderChart(items) {
  svg.querySelectorAll(".generated").forEach(node => node.remove());
  if (!svg.querySelector(".axis")) svg.insertAdjacentHTML("beforeend", baseChart());

  items.forEach((finding, index) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "point generated");
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");
    group.setAttribute("data-id", finding.id);
    group.setAttribute("aria-label", `${finding.title}. Observed ${finding.observed} of 6, impact ${finding.impact} of 5, ${finding.confidence} confidence.`);
    group.setAttribute("transform", `translate(${x(finding.observed)} ${y(finding.impact)})`);
    group.innerHTML = `
      <circle r="10"></circle>
      <text x="16" y="-5">${finding.title}</text>
      <text class="confidence" x="16" y="11" ${confidenceToggle.checked ? "" : "hidden"}>${finding.confidence} confidence</text>`;
    group.addEventListener("click", () => selectFinding(finding));
    group.addEventListener("focus", () => selectFinding(finding, false));
    group.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectFinding(finding);
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const points = [...svg.querySelectorAll(".point")];
        points[(index + 1) % points.length].focus();
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const points = [...svg.querySelectorAll(".point")];
        points[(index - 1 + points.length) % points.length].focus();
      }
    });
    svg.appendChild(group);
  });
}

function renderTable(items) {
  tableBody.innerHTML = items.map(finding => `
    <tr>
      <td>${finding.title}</td>
      <td>${finding.stage}</td>
      <td>${finding.observed} of 6</td>
      <td>${finding.impact} of 5</td>
      <td>${finding.confidence}</td>
      <td>${finding.next}</td>
    </tr>`).join("");
}

function render() {
  const items = visibleFindings();
  renderChart(items);
  renderTable(items);
  resultCount.textContent = `Showing ${items.length} synthetic ${items.length === 1 ? "finding" : "findings"}.`;
  liveUpdate.textContent = resultCount.textContent;
  if (items.length) selectFinding(items[0], false);
}

viewButtons.forEach(button => button.addEventListener("click", () => {
  const showChart = button.dataset.view === "chart";
  chartView.hidden = !showChart;
  tableView.hidden = showChart;
  viewButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  liveUpdate.textContent = `${button.textContent} view selected.`;
}));

stageFilter.addEventListener("change", render);
confidenceToggle.addEventListener("change", render);
render();
