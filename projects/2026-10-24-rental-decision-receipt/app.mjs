import { SAMPLE_LISTINGS, buildReceipt, compare, money } from "./model.mjs";

const form = document.querySelector("#listing-form");
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const download = document.querySelector("#download");

function evidenceMarkup(items) {
  return items.map(item => `
    <li><span class="signal ${item.verified ? "verified" : "review"}">${item.verified ? "Documented" : "Verify"}</span>
      <strong>${item.claim}</strong><small>${item.source} · checked ${item.checked}</small></li>`).join("");
}

function render() {
  const ids = [...form.querySelectorAll("input:checked")].map(input => input.value);
  const chosen = SAMPLE_LISTINGS.filter(listing => ids.includes(listing.id));
  if (chosen.length < 2) {
    results.innerHTML = "";
    download.hidden = true;
    status.textContent = "Choose at least two listings to compare.";
    return;
  }
  const compared = compare(chosen);
  results.innerHTML = compared.map(item => `
    <article class="result-card">
      <div class="card-head"><div><p class="eyebrow">${item.difference === 0 ? "Lowest monthly total" : `${money(item.difference)} more monthly`}</p><h3>${item.title}</h3></div><p class="total">${money(item.monthlyTotal)}<span>/month</span></p></div>
      <dl><div><dt>Base rent</dt><dd>${money(item.rent)}</dd></div><div><dt>Recurring extras</dt><dd>${money(item.recurringExtras)}</dd></div><div><dt>Due before move-in</dt><dd>${money(item.upfrontTotal)}</dd></div></dl>
      <h4>Claim evidence</h4><ul class="evidence">${evidenceMarkup(item.evidence)}</ul>
    </article>`).join("");
  status.textContent = `${chosen.length} listings compared. Costs are kept separate from claim evidence.`;
  download.hidden = false;
  download.onclick = () => {
    const blob = new Blob([JSON.stringify(buildReceipt(chosen), null, 2)], { type: "application/json" });
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "rental-decision-receipt.json" });
    link.click(); URL.revokeObjectURL(link.href);
  };
}

document.querySelector("#choices").innerHTML = SAMPLE_LISTINGS.map((listing, index) => `
  <label class="choice"><input type="checkbox" value="${listing.id}" ${index < 2 ? "checked" : ""}><span><strong>${listing.title}</strong><small>${money(listing.rent)} advertised rent</small></span></label>`).join("");
form.addEventListener("change", render);
render();
