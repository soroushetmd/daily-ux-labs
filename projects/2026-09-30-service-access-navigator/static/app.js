const form = document.querySelector("#questions");
const results = document.querySelector("#results");
const cards = document.querySelector("#cards");
const status = document.querySelector("#status");

form.addEventListener("submit", async event => {
  event.preventDefault();
  const data = new FormData(form);
  const params = new URLSearchParams({
    urgent: data.has("urgent"), mobility: data.has("mobility"),
    digital: data.has("digital"), language: data.has("language")
  });
  status.textContent = "Comparing options…";
  try {
    const response = await fetch(`/api/recommend?${params}`);
    if (!response.ok) throw new Error("Service unavailable");
    const payload = await response.json();
    cards.replaceChildren(...payload.options.map((option, index) => card(option, index)));
    results.hidden = false;
    status.textContent = "Comparison updated. All three options remain available.";
    document.querySelector("#results-title").focus({ preventScroll: true });
    results.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  } catch (error) {
    status.textContent = "The comparison could not be loaded. Please try again.";
  }
});

function card(option, index) {
  const article = document.createElement("article");
  article.className = "card";
  const badge = index === 0 ? '<span class="badge">Closest fit</span>' : '<span class="badge badge--secondary">Alternative</span>';
  article.innerHTML = `${badge}<h3>${escapeHtml(option.name)}</h3><p class="wait">${escapeHtml(option.wait)}</p>
    <h4>Why it may fit</h4><ul>${option.reasons.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    ${option.cautions.length ? `<h4>Consider</h4><ul>${option.cautions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}`;
  return article;
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}
