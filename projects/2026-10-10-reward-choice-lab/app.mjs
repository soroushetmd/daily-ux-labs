import { applyChoice, canChoose, describe, formatMoney, options } from "./economy.mjs";

let state = { crystals: 40, rewardedAdsToday: 0, dailyAdLimit: 2, simulatedSpendCents: 0 };
const grid = document.querySelector("#option-grid");
const status = document.querySelector("#status");

function updateWallet() {
  document.querySelector("#crystals").textContent = state.crystals;
  document.querySelector("#ads-used").textContent = state.rewardedAdsToday;
  document.querySelector("#spend").textContent = `${formatMoney(state.simulatedSpendCents)} simulated spend`;
}

function render() {
  grid.replaceChildren();
  for (const option of options) {
    const facts = describe(option);
    const availability = canChoose(option, state);
    const card = document.createElement("article");
    card.className = "option-card";
    card.innerHTML = `<div><p class="option-kicker">${option.id === "play" ? "Earn" : option.id === "ad" ? "Optional ad" : "Simulated purchase"}</p>
      <h3>${option.name}</h3><p>${option.detail}</p></div>
      <dl><div><dt>Reward</dt><dd>${facts.reward}</dd></div><div><dt>Money</dt><dd>${facts.money}</dd></div><div><dt>Time</dt><dd>${facts.time}</dd></div><div><dt>Advertising</dt><dd>${facts.ads}</dd></div></dl>
      <p class="consequence"><strong>What this means:</strong> ${option.consequence}</p>
      <button type="button" data-option="${option.id}" ${availability.allowed ? "" : "disabled"}>${availability.allowed ? `Choose ${option.name}` : availability.reason}</button>`;
    grid.append(card);
  }
}

grid.addEventListener("click", event => {
  const button = event.target.closest("button[data-option]");
  if (!button) return;
  const option = options.find(item => item.id === button.dataset.option);
  const result = applyChoice(option, state);
  state = result.state;
  status.textContent = `${result.event} This is a simulation; no real ad or purchase occurred.`;
  updateWallet();
  render();
});

updateWallet();
render();
