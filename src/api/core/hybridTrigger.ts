import { eventsStore } from "./eventsStore";

const MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 min
const MC_MIN_THRESHOLD = 3000;          // min MC to allow draws
const MC_DELTA_PERCENT = 0.15;          // 15% increase triggers early draw

export function shouldTriggerDraw(currentMc: number) {
  const draws = eventsStore.tail("draw", 1);
  const lastDraw = draws[0] ?? null;

  const now = Date.now();

  if (!lastDraw) {
    return { trigger: true, reason: "first_draw" };
  }

  const timeSince = now - Number(lastDraw.createdAt ?? 0);

  const lastMc = Number(lastDraw.mc ?? 0);

  // Condition A: rolling interval + minimum MC
  if (timeSince >= MIN_INTERVAL_MS && currentMc >= MC_MIN_THRESHOLD) {
    return { trigger: true, reason: "interval" };
  }

  // Condition B: MC spike
  if (lastMc > 0) {
    const delta = (currentMc - lastMc) / lastMc;
    if (delta >= MC_DELTA_PERCENT) {
      return { trigger: true, reason: "mc_spike" };
    }
  }

  return { trigger: false };
}
