import { calcTickets } from "../ticket-calculator/calcTickets";
import { runWeeklyRaffle } from "../raffle/weeklyRaffle";

const BRONZE_MIN = 1_000;
const TIER_MIN = 1_000;
const BASE_TICKETS = 10;
const SEED = "WEEK_1_SEED";

// 20 plankton at just above minimum, active
const plankton = Array.from({ length: 20 }).map((_, i) => {
  const out = calcTickets({
    userAvgTokens7d: BRONZE_MIN + 10, // barely eligible
    games7d: 5,
    activeRefs: 0,
    tierMinTokens: TIER_MIN,
    baseTickets: BASE_TICKETS,
    bronzeMinTokens: BRONZE_MIN
  });
  return { userId: `P${i + 1}`, tickets: out.tickets };
});

// 1 whale with huge 7d avg, also active
const whaleOut = calcTickets({
  userAvgTokens7d: 500_000,
  games7d: 5,
  activeRefs: 0,
  tierMinTokens: TIER_MIN,
  baseTickets: BASE_TICKETS,
  bronzeMinTokens: BRONZE_MIN
});
const whale = { userId: "WHALE", tickets: whaleOut.tickets };

const entries = [...plankton, whale];
const result = runWeeklyRaffle(entries, SEED);

console.log("=== COLD SIMULATION 2 (WHALE, LOCKED TICKETS) ===");
console.log("Whale tickets:", whale.tickets);
console.log("Plankton sample tickets:", plankton[0]?.tickets);
console.log("Total entries:", entries.length);
console.log("Total tickets:", entries.reduce((s, e) => s + e.tickets, 0));
console.log("Winner:", result.winnerUserId);

