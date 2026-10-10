import test from "node:test";
import assert from "node:assert/strict";
import { applyChoice, auditOptions, canChoose, describe, formatMoney, options } from "./economy.mjs";

const state = { crystals: 40, rewardedAdsToday: 0, dailyAdLimit: 2, simulatedSpendCents: 0 };

test("all options disclose reward, money, time, ads, and consequence", () => {
  for (const result of auditOptions(options)) {
    assert.equal(Object.values(result).slice(1).every(Boolean), true);
  }
});

test("money is formatted in Canadian dollars", () => {
  assert.match(formatMoney(199), /1\.99/);
  assert.equal(describe(options[0]).money, "No payment");
});

test("rewarded ads respect the daily limit", () => {
  const capped = { ...state, rewardedAdsToday: 2 };
  assert.equal(canChoose(options[1], capped).allowed, false);
  assert.match(canChoose(options[1], capped).reason, /limit reached/);
});

test("blocked choices do not mutate state", () => {
  const capped = { ...state, rewardedAdsToday: 2 };
  const result = applyChoice(options[1], capped);
  assert.deepEqual(result.state, capped);
});

test("purchase simulation tracks disclosed spend and reward", () => {
  const result = applyChoice(options[2], state);
  assert.equal(result.state.crystals, 340);
  assert.equal(result.state.simulatedSpendCents, 199);
  assert.equal(state.simulatedSpendCents, 0);
});

test("play remains available without payment or ads", () => {
  const result = applyChoice(options[0], { ...state, rewardedAdsToday: 2 });
  assert.equal(result.state.crystals, 160);
  assert.equal(result.state.rewardedAdsToday, 2);
  assert.equal(result.state.simulatedSpendCents, 0);
});
