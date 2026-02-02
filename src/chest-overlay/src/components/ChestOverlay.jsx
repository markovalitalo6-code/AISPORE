// src/components/ChestOverlay.jsx
// 5 states + JSON + smooth fades + demo + ROBUST audio unlock (z-index + global gesture)

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATES = ["CLOSED", "TREMBLE", "GLOW", "OPEN", "WIN"];
const pretty = { CLOSED: "Closed", TREMBLE: "Trembling", GLOW: "Glowing", OPEN: "Opening", WIN: "Jackpot!" };

const caveBg =
  "radial-gradient(60% 80% at 50% 70%, rgba(255,200,80,0.10) 0%, rgba(0,0,0,0.0) 30%), radial-gradient(80% 90% at 50% 120%, rgba(0,0,0,0.9) 20%, #040506 80%)";

const srcMap = {
  CLOSED: "/assets/chest/chest_closed.mp4",
  TREMBLE: "/assets/chest/chest_tremble.mp4",
  GLOW:    "/assets/chest/chest_glow.mp4",
  OPEN:    "/assets/chest/chest_open.mp4",
  WIN:     "/assets/chest/chest_win.mp4",
};

// --- canon.json poll ---
function useCanon(pollMs = 2500) {
  const [canon, setCanon] = useState({ state: "CLOSED", mc: 0, jackpot: 0, updatedAt: 0 });
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/data/canon.json?ts=" + Date.now(), { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (mounted) setCanon(j);
      } catch {}
    };
    load();
    const id = setInterval(load, pollMs);
    return () => { mounted = false; clearInterval(id); };
  }, [pollMs]);
  return canon;
}

// --- safe video ---
function SafeVideo({ src }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCanPlay = () => el.play().catch(() => {});
    el.addEventListener("canplay", onCanPlay);
    el.play().catch(() => {});
    return () => el.removeEventListener("canplay", onCanPlay);
  }, [src]);
  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

// --- smooth volume ramp ---
function useSmoothVolume(audioRef, target, seconds = 1.0) {
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    let raf = 0;
    const startVol = el.volume ?? 0;
    const endVol = Math.max(0, Math.min(1, target));
    if (Math.abs(startVol - endVol) < 0.001) return;
    const start = performance.now();
    const dur = Math.max(0.1, seconds) * 1000;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const k = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; // easeInOut
      el.volume = startVol + (endVol - startVol) * k;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [audioRef, target, seconds]);
}

export default function ChestOverlay({ devMode = false }) {
  const canon = useCanon();
  const [local, setLocal] = useState("CLOSED");

  const audioRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);

  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const demo = search?.get("demo") === "1";

  const current = (devMode || demo) ? local : (STATES.includes(canon.state) ? canon.state : "CLOSED");
  const src = srcMap[current] || srcMap.CLOSED;

  const vis = useMemo(() => {
    switch (current) {
      case "CLOSED":  return { pulse: 0.00, bloom: 12, shake: 0 };
      case "TREMBLE": return { pulse: 0.02, bloom: 16, shake: 2 };
      case "GLOW":    return { pulse: 0.06, bloom: 24, shake: 0 };
      case "OPEN":    return { pulse: 0.10, bloom: 32, shake: 0 };
      case "WIN":     return { pulse: 0.14, bloom: 40, shake: 0 };
      default:        return { pulse: 0.00, bloom: 12, shake: 0 };
    }
  }, [current]);

  // demo hotkeys
  useEffect(() => {
    if (!(devMode || demo)) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") setLocal((p) => STATES[(STATES.indexOf(p) + 1) % STATES.length]);
      else if (e.key === "ArrowLeft") setLocal((p) => STATES[(STATES.indexOf(p) - 1 + STATES.length) % STATES.length]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [devMode, demo]);

  // demo auto cycle
  useEffect(() => {
    if (!demo) return;
    const id = setInterval(() => {
      setLocal((p) => STATES[(STATES.indexOf(p) + 1) % STATES.length]);
    }, 4000);
    return () => clearInterval(id);
  }, [demo]);

  // global gesture unlock (plus center button)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = true;      // start muted for autoplay policy
    el.volume = 0.22;
    const tryPlay = async () => {
      try {
        el.muted = false;
        await el.play();
        setAudioReady(true);
        window.removeEventListener("pointerdown", tryPlay);
        window.removeEventListener("keydown", tryPlay);
      } catch {
        // keep waiting
      }
    };
    // try immediately (may be blocked)
    el.play().catch(() => {});
    // wait for real gesture
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("keydown", tryPlay);
    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
  }, []);

  // target volume per state
  const targetVolume =
    !audioReady ? 0.0 :
    current === "CLOSED"   ? 0.18 :
    current === "TREMBLE"  ? 0.22 :
    current === "GLOW"     ? 0.28 :
    current === "OPEN"     ? 0.34 :
                             0.48; // WIN

  useSmoothVolume(audioRef, targetVolume, 1.0);

  // while audio not ready, block pointer events on content so the button gets clicks
  const contentPointer = audioReady ? "auto" : "none";

  // center button handler
  const enableSound = async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.muted = false;
      el.volume = 0.22;
      await el.play();
      setAudioReady(true);
    } catch (e) {
      console.warn("Audio play blocked:", e);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: caveBg, position: "relative" }}>
      {/* POINT THIS TO YOUR SUNO FILE */}
      <audio ref={audioRef} src="/assets/music/epic_rise.mp3" loop preload="auto" />

      {/* HUD */}
      <div style={{ position: "absolute", left: 16, top: 12, color: "rgba(220,220,220,0.85)", fontSize: 13, zIndex: 5 }}>
        <div>State: {pretty[current]}</div>
        {(devMode || demo) && <div>Controls: ← / → or click</div>}
      </div>

      {/* BIG CENTER “Enable Sound” BUTTON on top */}
      {!audioReady && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 10000 }}>
          <button
            onClick={enableSound}
            style={{
              background: "rgba(0,0,0,0.7)",
              color: "#ffd36a",
              border: "1px solid rgba(255,211,106,0.6)",
              borderRadius: 14,
              padding: "14px 18px",
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 0 22px rgba(255,211,106,0.25)",
            }}
          >
            🔊 Enable Sound
          </button>
        </div>
      )}

      {/* Chest video + fade (pointer events blocked until audioReady) */}
      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", pointerEvents: contentPointer }}>
        <motion.div
          style={{ width: "56vmin", maxWidth: 620, aspectRatio: "200/160", borderRadius: 18, background: "linear-gradient(180deg,#0f0c06,transparent)", position: "relative", overflow: "hidden" }}
          animate={{ scale: 1 + vis.pulse, rotate: vis.shake ? [0, 0.6, -0.5, 0] : 0, boxShadow: `0 0 ${vis.bloom}px 12px rgba(255,204,64,0.23)` }}
          transition={{ duration: vis.shake ? 0.35 : 1.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0 }}
            >
              <SafeVideo src={src} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
