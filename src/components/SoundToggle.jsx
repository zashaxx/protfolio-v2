import { Volume2, VolumeX } from "lucide-react";

export default function SoundToggle({ enabled, onToggle }) {
  const Icon = enabled ? Volume2 : VolumeX;

  return (
    <button
      className="sound-toggle"
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable interface sounds" : "Enable interface sounds"}
      title={enabled ? "Sounds on" : "Sounds off"}
    >
      <Icon size={16} strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}
