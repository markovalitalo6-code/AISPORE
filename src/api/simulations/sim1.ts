import { calcTickets } from "../ticket-calculator/calcTickets";
import { runWeeklyRaffle } from "../raffle/weeklyRaffle";

const BRONZE_MIN = 1_000;
const TIER_MIN = 1_000;      // bronze tier min for this sim
const BASE_TICKETS = 10;     // bronze base
const SEED = "WEEK_1_SEED";

// 10 users with increasing average holdings (7d avg tokens)
const users = Array.from({ length: 10 }).map((_, i) => ({
  userId: `U${i + 1}`,
  H: BRONZE_MIN + i * 500, // 1000..5500
  games7d: 5,              // active
  activeRefs: 0
}));

const entries = users.map(u => {
  const out = calcTickets({
    userAvgTokens7d: u.H,
    games7d: u.games7d,
    activeRefs: u.activeRefs,
    tierMinTokens: TIER_MIN,
    baseTickets: BASE_TICKETS,
    bronzeMinTokens: BRONZE_MIN
  });
  return { userId: u.userId, tickets: out.tickets };
});

const result = runWeeklyRaffle(entries, SEED);

console.log("=== COLD SIMULATION 1 (LOCKED TICKETS) ===");
console.log("Entries:", entries);
console.log("Result:", result);

