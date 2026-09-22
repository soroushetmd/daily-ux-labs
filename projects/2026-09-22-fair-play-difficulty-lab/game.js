import { nextWindow, scoreHit, summarize } from "./engine.mjs";

const TOTAL_ROUNDS = 10;
const cells = [];
const state = { running: false, round: 0, score: 0, window: 1600, target: -1, cursor: 12, startedAt: 0, timer: null, results: [] };

const grid = document.querySelector("#grid");
const startButton = document.querySelector("#start-button");
const paceLock = document.querySelector("#pace-lock");
const largeTarget = document.querySelector("#large-target");
const extraTime = document.querySelector("#extra-time");
const roundValue = document.querySelector("#round-value");
const scoreValue = document.querySelector("#score-value");
const paceValue = document.querySelector("#pace-value");
const statusCopy = document.querySelector("#status-copy");
const whyTitle = document.querySelector("#why-title");
const whyCopy = document.querySelector("#why-copy");
const liveUpdate = document.querySelector("#live-update");

for (let index = 0; index < 25; index += 1) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cell";
  button.setAttribute("aria-label", `Cell ${index + 1}`);
  button.addEventListener("click", () => choose(index));
  grid.appendChild(button);
  cells.push(button);
}

function activeWindow() { return state.window + (extraTime.checked ? 600 : 0); }
function announce(message) { liveUpdate.textContent = ""; requestAnimationFrame(() => { liveUpdate.textContent = message; }); }

function render() {
  cells.forEach((cell, index) => {
    cell.classList.toggle("target", state.running && index === state.target);
    cell.classList.toggle("cursor", index === state.cursor);
    cell.setAttribute("aria-label", `${index === state.target ? "Target, " : ""}Cell ${index + 1}`);
  });
  grid.classList.toggle("large-target", largeTarget.checked);
  roundValue.textContent = `${state.round} / ${TOTAL_ROUNDS}`;
  scoreValue.textContent = String(state.score);
  paceValue.textContent = `${(activeWindow() / 1000).toFixed(2)} s`;
}

function setTarget() {
  let next = Math.floor(Math.random() * cells.length);
  if (next === state.target) next = (next + 7) % cells.length;
  state.target = next;
  state.startedAt = performance.now();
  clearTimeout(state.timer);
  state.timer = setTimeout(() => finishRound(false), activeWindow());
  render();
  announce(`Round ${state.round}. Target is in row ${Math.floor(next / 5) + 1}, column ${(next % 5) + 1}.`);
}

function choose(index) {
  if (!state.running) return;
  if (index === state.target) finishRound(true);
  else announce("That cell is not the target. Keep looking.");
}

function finishRound(hit) {
  if (!state.running) return;
  clearTimeout(state.timer);
  const elapsed = Math.min(Math.round(performance.now() - state.startedAt), activeWindow());
  const earned = hit ? scoreHit(elapsed, activeWindow()) : 0;
  state.score += earned;
  state.results.push({ hit, elapsed, score: earned });
  const adjustment = nextWindow(state.window, state.results, paceLock.checked);
  const changed = adjustment.window !== state.window;
  state.window = adjustment.window;
  whyTitle.textContent = changed ? "Pace adjusted" : "Pace unchanged";
  whyCopy.textContent = adjustment.reason;
  statusCopy.textContent = hit ? `Hit in ${elapsed} ms · +${earned} points` : "Target missed · no score penalty";
  announce(`${statusCopy.textContent}. ${adjustment.reason}`);
  render();
  if (state.round >= TOTAL_ROUNDS) setTimeout(endSession, 650);
  else { state.round += 1; setTimeout(setTarget, 650); }
}

function endSession() {
  state.running = false;
  state.target = -1;
  const summary = summarize(state.results);
  statusCopy.textContent = `${summary.hits} hits · ${summary.accuracy}% accuracy · ${summary.average || "—"} ms average hit`;
  whyTitle.textContent = "Session complete";
  whyCopy.textContent = `Final score: ${summary.score}. Assistance settings never reduced the score.`;
  startButton.textContent = "Play again";
  startButton.disabled = false;
  render();
  announce(`Session complete. ${statusCopy.textContent}. Final score ${summary.score}.`);
}

function startSession() {
  clearTimeout(state.timer);
  Object.assign(state, { running: true, round: 1, score: 0, window: 1600, target: -1, cursor: 12, results: [] });
  startButton.disabled = true;
  startButton.textContent = "Session running";
  whyTitle.textContent = "Watching the first rounds";
  whyCopy.textContent = "The pace changes only after enough recent play data is available.";
  statusCopy.textContent = "Find the highlighted signal.";
  setTarget();
}

function moveCursor(key) {
  const row = Math.floor(state.cursor / 5);
  const column = state.cursor % 5;
  if (key === "ArrowLeft") state.cursor = row * 5 + Math.max(0, column - 1);
  if (key === "ArrowRight") state.cursor = row * 5 + Math.min(4, column + 1);
  if (key === "ArrowUp") state.cursor = Math.max(0, row - 1) * 5 + column;
  if (key === "ArrowDown") state.cursor = Math.min(4, row + 1) * 5 + column;
  render();
}

document.addEventListener("keydown", event => {
  if (!state.running) return;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); moveCursor(event.key); }
  if (event.key === " ") { event.preventDefault(); choose(state.cursor); }
});
startButton.addEventListener("click", startSession);
largeTarget.addEventListener("change", render);
extraTime.addEventListener("change", () => { render(); announce(`Extra response time ${extraTime.checked ? "enabled" : "disabled"}. It applies from the next round.`); });
paceLock.addEventListener("change", () => announce(`Automatic pace adjustment ${paceLock.checked ? "locked" : "unlocked"}.`));
render();
