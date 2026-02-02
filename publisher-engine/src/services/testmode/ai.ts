
export type AIDecision = {
  allowOpen: boolean;
  reason: string;
};

export function aiGateOpen(): AIDecision {
  // Stub: myöhemmin LLM + signals.
  return { allowOpen: true, reason: "testmode stub allow" };
}
