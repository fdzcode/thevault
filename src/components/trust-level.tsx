type Tier = { name: string; numeral: string; color: string; bg: string; border: string; min: number; glow?: boolean };

const TIERS: Tier[] = [
  { name: "Initiated", numeral: "I", color: "#71717a", bg: "rgba(113,113,122,0.15)", border: "rgba(113,113,122,0.3)", min: 0 },
  { name: "Verified", numeral: "II", color: "#60a5fa", bg: "rgba(96,165,250,0.15)", border: "rgba(96,165,250,0.3)", min: 3 },
  { name: "Trusted", numeral: "III", color: "#D4AF37", bg: "rgba(212,175,55,0.15)", border: "rgba(212,175,55,0.3)", min: 10 },
  { name: "Vaulted", numeral: "IV", color: "#c084fc", bg: "rgba(192,132,252,0.15)", border: "rgba(192,132,252,0.3)", min: 25 },
  { name: "Founding", numeral: "V", color: "#D4AF37", bg: "rgba(212,175,55,0.2)", border: "rgba(212,175,55,0.5)", min: 50, glow: true },
];

function getTier(tradeCount: number) {
  let tierIdx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const t = TIERS[i];
    if (t && tradeCount >= t.min) {
      tierIdx = i;
      break;
    }
  }
  const tier = TIERS[tierIdx]!;
  const nextTier = tierIdx + 1 < TIERS.length ? TIERS[tierIdx + 1] : undefined;
  let progress = 100;
  if (nextTier) {
    const range = nextTier.min - tier.min;
    const done = tradeCount - tier.min;
    progress = Math.min(100, Math.round((done / range) * 100));
  }
  return { tierIdx, tier, nextTier, progress };
}

export function TrustLevel({ tradeCount }: { tradeCount: number }) {
  const { tierIdx, tier, nextTier, progress } = getTier(tradeCount);

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
        Trust Level
      </h2>

      {/* Tier circles */}
      <div className="flex items-center justify-between gap-1">
        {TIERS.map((t, i) => {
          const isReached = i <= tierIdx;
          const isCurrent = i === tierIdx;
          return (
            <div key={t.name} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex items-center w-full">
                {/* Circle */}
                <div
                  className={`relative mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${isCurrent ? "escrow-pulse" : ""}`}
                  style={{
                    background: isReached ? t.bg : "rgba(255,255,255,0.02)",
                    borderColor: isReached ? t.border : "rgba(255,255,255,0.06)",
                    color: isReached ? t.color : "var(--text-muted)",
                    boxShadow: isCurrent && t.glow
                      ? `0 0 20px ${t.color}40, 0 0 40px ${t.color}20`
                      : isCurrent
                        ? `0 0 12px ${t.color}30`
                        : "none",
                  }}
                >
                  {t.numeral}
                  {isCurrent && t.glow && (
                    <div
                      className="absolute inset-0 rounded-full animate-gold-pulse"
                      style={{
                        boxShadow: `0 0 20px ${t.color}50`,
                      }}
                    />
                  )}
                </div>
              </div>
              <span
                className="text-[10px] font-medium tracking-wider uppercase"
                style={{ color: isReached ? t.color : "var(--text-muted)" }}
              >
                {t.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar to next level */}
      {nextTier ? (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted">
              Progress to <span style={{ color: nextTier.color }}>{nextTier.name}</span>
            </span>
            <span className="text-xs font-semibold" style={{ color: tier.color }}>
              {tradeCount}/{nextTier.min} trades
            </span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 text-center">
          <span className="text-xs font-semibold" style={{ color: tier.color }}>
            Maximum trust level achieved
          </span>
        </div>
      )}
    </div>
  );
}
