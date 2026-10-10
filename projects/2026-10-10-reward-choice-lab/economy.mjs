export const options = [
  {
    id: "play",
    name: "Play to earn",
    reward: 120,
    moneyCents: 0,
    timeSeconds: 480,
    adViews: 0,
    detail: "Complete two short demo challenges.",
    consequence: "No payment or advertising. Progress depends on gameplay completion."
  },
  {
    id: "ad",
    name: "Watch a rewarded ad",
    reward: 120,
    moneyCents: 0,
    timeSeconds: 30,
    adViews: 1,
    detail: "Opt in to one simulated 30-second ad.",
    consequence: "Uses attention instead of money. Declining does not remove the other choices."
  },
  {
    id: "purchase",
    name: "Buy the starter pack",
    reward: 300,
    moneyCents: 199,
    timeSeconds: 0,
    adViews: 0,
    detail: "One simulated purchase for CAD $1.99.",
    consequence: "Costs real money in a production context. This prototype never starts a transaction."
  }
];

export function formatMoney(cents) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function describe(option) {
  return {
    reward: `${option.reward} crystals`,
    money: option.moneyCents ? formatMoney(option.moneyCents) : "No payment",
    time: option.timeSeconds ? `${option.timeSeconds} seconds` : "Immediate",
    ads: option.adViews ? `${option.adViews} optional ad` : "No ads"
  };
}

export function canChoose(option, state) {
  if (option.id === "ad" && state.rewardedAdsToday >= state.dailyAdLimit) {
    return { allowed: false, reason: "Daily rewarded-ad limit reached." };
  }
  return { allowed: true, reason: "Available" };
}

export function applyChoice(option, state) {
  const availability = canChoose(option, state);
  if (!availability.allowed) return { state, event: availability.reason };
  const next = {
    ...state,
    crystals: state.crystals + option.reward,
    rewardedAdsToday: state.rewardedAdsToday + (option.id === "ad" ? 1 : 0),
    simulatedSpendCents: state.simulatedSpendCents + option.moneyCents
  };
  return { state: next, event: `${option.name} selected. ${option.reward} demo crystals added.` };
}

export function auditOptions(items) {
  return items.map(option => ({
    id: option.id,
    hasReward: option.reward > 0,
    disclosesMoney: Number.isInteger(option.moneyCents),
    disclosesTime: Number.isInteger(option.timeSeconds),
    disclosesAds: Number.isInteger(option.adViews),
    hasConsequence: Boolean(option.consequence.trim())
  }));
}
