// ChestOverlay.jsx
// Simplified version – visual “chest” overlay demo for Vite/React
// Works immediately with devMode={true}.

import { useState } from "react";
import { motion } from "framer-motion";

export default function ChestOverlay({ devMode = true }) {
  const [state, setState] = useState("CLOSED");

  const states = ["CLOSED", "TREMBLE", "GLOW", "OPEN", "WIN"];
  const colors = {
    CLOSED: "#5c3b17",
    TREMBLE: "#8a5515",
    GLOW: "#caa66a",
    OPEN: "#ffd36a",
    WIN: "#fff4cc",
  };

  const nextState = () => {
    const i = states.indexOf(state);
    const next = states[(i + 1) % states.length];
    setState(next);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background:
          "radial-gradient(circle at center, #1a1206 0%, #000000 90%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <motion.div
        onClick={devMode ? nextState : undefined}
        animate={{
          scale: [1, 1.03, 1],
          rotate: state === "TREMBLE" ? [0, 1, -1, 0] : 0,
          boxShadow: `0 0 ${state === "GLOW" ? 40 : 10}px ${colors[state]}`,
          backgroundColor: colors[state],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: "mirror",
        }}
        style={{
          width: 200,
          height: 140,
          borderRadius: 12,
          cursor: "pointer",
          border: "3px solid #222",
        }}
      />

      <div style={{ marginTop: 20, fontSize: 18 }}>
        State: <strong>{state}</strong>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        (Click chest to cycle states)
      </div>
    </div>
  );
}
