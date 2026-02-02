import WSControls from "./components/WSControls";
import ChestOverlay from "./components/ChestOverlay";
import SoundFX from "./components/SoundFX"; // ← tämä

export default function App() {
  return (
    <>
      <WSControls />
      <SoundFX />  {/* ← tämä */}
      <ChestOverlay />
    </>
  );
}
