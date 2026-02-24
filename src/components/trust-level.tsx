type Tier = {
  name: string;
  numeral: string;
  color: string;
  bg: string;
  border: string;
  min: number;
  glow?: boolean;
  desc: string;
};

const TIERS: Tier[] = [
  {
    name: "Initiated",
    numeral: "I",
    color: "#71717a",
    bg: "rgba(113,113,122,0.15)",
    border: "rgba(113,113,122,0.3)",
    min: 0,
    desc: "Welcome to The Vault. Complete your first trades to build trust.",
  },
  {
    name: "Verified",
    numeral: "II",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.15)",
    border: "rgba(96,165,250,0.3)",
    min: 3,
    desc: "You've proven yourself as a reliable trader. Keep going.",
  },
  {
    name: "Trusted",
    numeral: "III",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.15)",
    border: "rgba(212,175,55,0.3)",
    min: 10,
    desc: "A respected member of The Vault community.",
  },
  {
    name: "Vaulted",
    numeral: "IV",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.15)",
    border: "rgba(192,132,252,0.3)",
    min: 25,
    glow: true,
    desc: "Elite status. You're among the most active traders.",
  },
  {
    name: "Founding",
    numeral: "V",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.2)",
    border: "rgba(212,175,55,0.5)",
    min: 50,
    glow: true,
    desc: "Legendary. A founding pillar of The Vault.",
  },
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
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "rgba(14,14,14,0.9)",
        border: `1px solid ${tier.border}`,
        boxShadow: tier.glow
          ? `0 0 30px ${tier.color}15, 0 0 60px ${tier.color}08`
          : `0 0 20px ${tier.color}10`,
      }}
    >
      {/* Top gradient accent line */}
      <div
        className="h-1 w-full"
        style={{
          background: nextTier
            ? `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`
            : `linear-gradient(90deg, ${tier.color}, ${tier.color}CC)`,
        }}
      />

      <div className="p-6">
        {/* Header row */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Trust Level
          </h2>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{
              background: tier.bg,
              color: tier.color,
              border: `1px solid ${tier.border}`,
            }}
          >
            {tier.numeral} &middot; {tier.name}
          </span>
        </div>

        {/* Tier circles with connecting line */}
        <div className="relative flex items-center justify-between">
          {/* Connecting line behind circles */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${(tierIdx / (TIERS.length - 1)) * 100}%`,
                background: `linear-gradient(90deg, ${TIERS[0]!.color}, ${tier.color})`,
              }}
            />
          </div>

          {TIERS.map((t, i) => {
            const isReached = i <= tierIdx;
            const isCurrent = i === tierIdx;
            return (
              <div key={t.name} className="relative z-10 flex flex-col items-center gap-2">
                {/* Pulsing ring behind current tier */}
                {isCurrent && (
                  <div
                    className="absolute top-0 h-12 w-12 rounded-full"
                    style={{
                      background: t.color,
                      opacity: 0.25,
                      animation: "trust-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                )}
                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${isCurrent ? "scale-110" : ""}`}
                  style={{
                    background: isReached
                      ? `${t.color}25`
                      : "rgba(255,255,255,0.02)",
                    borderColor: isReached ? t.color : "rgba(255,255,255,0.06)",
                    color: isReached ? t.color : "var(--text-muted)",
                    boxShadow: isCurrent
                      ? `0 0 20px ${t.color}50, 0 0 40px ${t.color}25`
                      : isReached
                        ? `0 0 10px ${t.color}20`
                        : "none",
                  }}
                >
                  {isReached && !isCurrent ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    t.numeral
                  )}
                </div>
                <span
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: isReached ? t.color : "var(--text-muted)" }}
                >
                  {t.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tier description card */}
        <div
          className="mt-6 rounded-xl p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-sm text-[var(--text-body)]">{tier.desc}</p>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted">
              <span className="font-semibold" style={{ color: tier.color }}>
                {tradeCount}
              </span>{" "}
              trades completed
            </span>
            {nextTier && (
              <span className="font-semibold" style={{ color: tier.color }}>
                {progress}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          {nextTier ? (
            <div className="mt-2">
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                {nextTier.min - tradeCount} more trade{nextTier.min - tradeCount !== 1 ? "s" : ""} to{" "}
                <span style={{ color: nextTier.color }}>{nextTier.name}</span>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-center text-xs font-semibold" style={{ color: tier.color }}>
              Maximum trust level achieved
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
