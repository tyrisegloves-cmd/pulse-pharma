"use client";

/**
 * EKG-style pulse line that beats continuously and whose "progress trace"
 * fills up to reflect the current order stage.
 *
 * - `stage`   : current stage index (1-based)
 * - `totalStages`: total number of stages
 *
 * Respects prefers-reduced-motion (handled in globals.css — the beat and
 * dash animations are disabled and the trace is shown fully filled to
 * the current progress instantly).
 */
interface PulseLineProps {
  stage: number;
  totalStages: number;
}

export function PulseLine({ stage, totalStages }: PulseLineProps) {
  // Progress 0..1 based on how far through the stages we are
  const progress = Math.min(1, Math.max(0, (stage - 1) / (totalStages - 1)));

  // Build an EKG-ish path: mostly flat baseline with periodic QRS spikes.
  // viewBox is 800 x 100, baseline at y=50.
  const buildPath = () => {
    const width = 800;
    const baseline = 50;
    const beats = 6;
    const spacing = width / beats;
    let d = `M 0 ${baseline}`;
    for (let i = 0; i < beats; i++) {
      const x = i * spacing + spacing / 2;
      // Small P wave
      d += ` L ${x - 40} ${baseline}`;
      d += ` Q ${x - 34} ${baseline - 6} ${x - 28} ${baseline}`;
      // Flat before QRS
      d += ` L ${x - 14} ${baseline}`;
      // Q down
      d += ` L ${x - 8} ${baseline + 8}`;
      // R up (big spike)
      d += ` L ${x} ${baseline - 30}`;
      // S down
      d += ` L ${x + 8} ${baseline + 10}`;
      // Back to baseline
      d += ` L ${x + 16} ${baseline}`;
      // Small T wave
      d += ` L ${x + 26} ${baseline}`;
      d += ` Q ${x + 34} ${baseline - 5} ${x + 42} ${baseline}`;
    }
    d += ` L ${width} ${baseline}`;
    return d;
  };

  const pathD = buildPath();

  return (
    <div
      className="w-full overflow-hidden"
      role="img"
      aria-label={`Order progress: stage ${stage} of ${totalStages}`}
    >
      <svg
        viewBox="0 0 800 100"
        preserveAspectRatio="none"
        className="w-full h-16 pulse-line-svg"
      >
        <defs>
          <linearGradient id="pulseFade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="1" />
            <stop offset="95%" stopColor="#dc2626" stopOpacity="1" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </linearGradient>
          <clipPath id="progressClip">
            {/* Grows from left to fill up to current progress */}
            <rect
              x="0"
              y="0"
              width={800 * progress}
              height="100"
              className="pulse-progress-rect"
            />
          </clipPath>
        </defs>

        {/* Baseline (unreached portion) — faint gray */}
        <path
          d={pathD}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Active progress trace, clipped to progress width */}
        <g clipPath="url(#progressClip)">
          <path
            d={pathD}
            fill="none"
            stroke="url(#pulseFade)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pulse-line-beat"
          />
        </g>
      </svg>
    </div>
  );
}
