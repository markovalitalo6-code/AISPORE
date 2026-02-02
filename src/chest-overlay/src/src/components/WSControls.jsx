// src/components/WSControls.jsx
import { useEffect } from "react";
import { connectWS, onWSMessage } from "../wsClient";

export default function WSControls() {
  useEffect(() => {
    connectWS(7070);
    const off = onWSMessage((msg) => {
      if (!msg || !msg.type) return;

      if (msg.type === "OPEN_CHEST") {
        const index = Number(msg.index) || 1;
        if (typeof window.openChest === "function") window.openChest(index);
        window.dispatchEvent(new CustomEvent("spore:open", { detail: { index } }));
      }

      if (msg.type === "CHEST_RESULT") {
        const outcome = msg.outcome === "win" ? "win" : "empty";
        if (typeof window.setOutcome === "function") window.setOutcome(outcome);
        window.dispatchEvent(new CustomEvent("spore:result", { detail: { outcome } }));
      }

      if (msg.type === "RESET") {
        if (typeof window.resetOverlay === "function") window.resetOverlay();
        window.dispatchEvent(new CustomEvent("spore:reset"));
      }

      // 🔊 Uudet: sound-komennot
      if (msg.type === "SOUND_ON") {
        window.dispatchEvent(new Event("spore:sound:on"));
      }
      if (msg.type === "SOUND_OFF") {
        window.dispatchEvent(new Event("spore:sound:off"));
      }
    });
    return off;
  }, []);

  return null; // näkymätön kontrolleri
}
