/**
 * Animated EKG waveform used as the app logo mark.
 * - A single stylized heartbeat draws itself across the badge on a loop
 *   (stroke-dashoffset animation)
 * - The whole mark gently pulses in scale/glow in sync with the beat
 * - Fully static under prefers-reduced-motion (handled in globals.css)
 */
export function LogoPulse({ size = 32 }: { size?: number }) {
  return (
    <div
      className="logo-pulse relative flex items-center justify-center rounded-lg bg-red-600 text-white shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        width={size - 8}
        height={size - 8}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="logo-pulse-svg"
      >
        {/* Faint baseline so the mark still reads as an EKG when the
            drawn trace is offscreen mid-animation */}
        <path
          d="M2 16 H30"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="1.25"
        />
        {/* The heartbeat trace itself: flat → small dip → tall spike → dip → flat */}
        <path
          className="logo-pulse-trace"
          d="M2 16 H10 L12 12 L14 20 L16 6 L18 22 L20 14 L22 16 H30"
        />
      </svg>
    </div>
  );
}
