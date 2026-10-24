export const SAMPLE_LISTINGS = [
  {
    id: "maple-14",
    title: "Maple Court · 1 bedroom",
    rent: 2140,
    monthly: { utilities: 95, parking: 120, internet: 55 },
    upfront: { deposit: 2140, keyDeposit: 50 },
    evidence: [
      { claim: "In-suite laundry", source: "Listing photos", checked: "2026-10-18", verified: true },
      { claim: "12-minute walk to transit", source: "Listing description", checked: "2026-10-18", verified: false }
    ]
  },
  {
    id: "cedar-88",
    title: "Cedar House · Studio",
    rent: 1985,
    monthly: { utilities: 0, parking: 165, internet: 65 },
    upfront: { deposit: 1985, keyDeposit: 0 },
    evidence: [
      { claim: "Utilities included", source: "Lease summary", checked: "2026-10-22", verified: true },
      { claim: "Quiet building", source: "Listing description", checked: "2026-10-12", verified: false }
    ]
  },
  {
    id: "river-302",
    title: "River Lofts · 1 bedroom",
    rent: 2290,
    monthly: { utilities: 110, parking: 0, internet: 0 },
    upfront: { deposit: 2290, keyDeposit: 100 },
    evidence: [
      { claim: "Internet included", source: "Property manager email", checked: "2026-10-23", verified: true },
      { claim: "No parking required", source: "User preference", checked: "2026-10-24", verified: true }
    ]
  }
];

const money = value => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

export function summarize(listing) {
  if (!listing || typeof listing.rent !== "number" || listing.rent < 0) throw new TypeError("Listing needs a non-negative rent.");
  const monthlyValues = Object.values(listing.monthly ?? {});
  const upfrontValues = Object.values(listing.upfront ?? {});
  if ([...monthlyValues, ...upfrontValues].some(value => typeof value !== "number" || value < 0)) throw new TypeError("Costs must be non-negative numbers.");
  const recurringExtras = monthlyValues.reduce((sum, value) => sum + value, 0);
  const upfrontTotal = upfrontValues.reduce((sum, value) => sum + value, 0);
  const evidence = listing.evidence ?? [];
  return {
    id: listing.id,
    title: listing.title,
    rent: listing.rent,
    recurringExtras,
    monthlyTotal: listing.rent + recurringExtras,
    upfrontTotal,
    verifiedClaims: evidence.filter(item => item.verified).length,
    reviewClaims: evidence.filter(item => !item.verified).length,
    evidence
  };
}

export function compare(listings) {
  const summaries = listings.map(summarize);
  const lowestMonthly = Math.min(...summaries.map(item => item.monthlyTotal));
  return summaries.map(item => ({ ...item, difference: item.monthlyTotal - lowestMonthly }));
}

export function buildReceipt(listings, created = new Date().toISOString()) {
  return {
    title: "Rental decision receipt",
    created,
    currency: "CAD",
    disclaimer: "Synthetic comparison only. Verify costs and claims with the housing provider.",
    listings: compare(listings)
  };
}

export { money };
