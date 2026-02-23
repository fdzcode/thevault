"use client";

type Invitee = {
  id: string;
  name: string | null;
  memberNumber: string | null;
  invitees: { id: string; name: string | null; memberNumber: string | null }[];
};

const NODE_W = 120;
const NODE_H = 52;
const H_GAP = 32;
const V_GAP = 80;

function NodeCircle({
  x,
  y,
  label,
  memberNumber,
  isYou,
  isEmpty,
}: {
  x: number;
  y: number;
  label: string;
  memberNumber?: string | null;
  isYou?: boolean;
  isEmpty?: boolean;
}) {
  const cx = x + NODE_W / 2;
  const cy = y + NODE_H / 2;

  if (isEmpty) {
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={22}
          fill="none"
          stroke="rgba(212,175,55,0.2)"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize={10}>
          Open
        </text>
      </g>
    );
  }

  return (
    <g>
      {/* Glow for YOU */}
      {isYou && (
        <circle cx={cx} cy={cy} r={28} fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth={1}>
          <animate attributeName="r" values="28;32;28" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Node circle */}
      <circle
        cx={cx}
        cy={cy}
        r={22}
        fill={isYou ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)"}
        stroke={isYou ? "#D4AF37" : "rgba(212,175,55,0.3)"}
        strokeWidth={isYou ? 2 : 1.5}
      />
      {/* Initial letter */}
      <text
        x={cx}
        y={cy - (memberNumber ? 3 : 0)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isYou ? "#D4AF37" : "var(--text-heading)"}
        fontSize={isYou ? 14 : 12}
        fontWeight={600}
        fontFamily="'Playfair Display', serif"
      >
        {isYou ? "YOU" : (label || "?").charAt(0).toUpperCase()}
      </text>
      {/* Member number */}
      {memberNumber && !isYou && (
        <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle" fill="#D4AF37" fontSize={8}>
          #{memberNumber}
        </text>
      )}
      {/* Name below */}
      <text x={cx} y={cy + 32} textAnchor="middle" fill="var(--text-body)" fontSize={10}>
        {isYou ? "" : (label || "User").slice(0, 14)}
      </text>
    </g>
  );
}

export function ReferralTree({
  invitees,
  openSlots,
}: {
  invitees: Invitee[];
  openSlots: number;
}) {
  // Layout: YOU at top center, invitees in row 2, sub-invitees in row 3
  const level1 = invitees;
  // Add open slots as empty nodes
  type L1Node = { id: string; empty: boolean; name: string | null; memberNumber: string | null };
  const realNodes: L1Node[] = level1.map((n) => ({ id: n.id, empty: false, name: n.name, memberNumber: n.memberNumber }));
  const emptyNodes: L1Node[] = Array.from({ length: Math.max(0, openSlots) }, (_, i) => ({
    id: `empty-${i}`,
    empty: true,
    name: null,
    memberNumber: null,
  }));
  const allLevel1 = [...realNodes, ...emptyNodes];

  // Calculate sub-invitees with parent positions
  type SubNode = { id: string; name: string | null; memberNumber: string | null; parentIdx: number };
  const level2: SubNode[] = [];
  level1.forEach((inv, idx) => {
    inv.invitees.forEach((sub) => {
      level2.push({ ...sub, parentIdx: idx });
    });
  });

  const l1Count = allLevel1.length;
  const l2Count = level2.length;

  const l1Width = l1Count * NODE_W + (l1Count - 1) * H_GAP;
  const l2Width = l2Count > 0 ? l2Count * NODE_W + (l2Count - 1) * H_GAP : 0;
  const totalWidth = Math.max(l1Width, l2Width, NODE_W) + 60;

  const rows = l2Count > 0 ? 3 : l1Count > 0 ? 2 : 1;
  const totalHeight = rows * (NODE_H + V_GAP) + 40;

  // Center positions
  const youX = totalWidth / 2 - NODE_W / 2;
  const youY = 20;

  const l1StartX = (totalWidth - l1Width) / 2;
  const l1Y = youY + NODE_H + V_GAP;

  const l2StartX = (totalWidth - l2Width) / 2;
  const l2Y = l1Y + NODE_H + V_GAP;

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="mx-auto"
        style={{ minWidth: Math.min(totalWidth, 300) }}
      >
        <defs>
          <linearGradient id="gold-line" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#F4E5C3" />
          </linearGradient>
        </defs>

        {/* Lines from YOU to level 1 */}
        {allLevel1.map((_, i) => {
          const fromCx = youX + NODE_W / 2;
          const fromCy = youY + NODE_H / 2 + 22;
          const toX = l1StartX + i * (NODE_W + H_GAP) + NODE_W / 2;
          const toY = l1Y + NODE_H / 2 - 22;
          return (
            <line
              key={`l0-${i}`}
              x1={fromCx}
              y1={fromCy}
              x2={toX}
              y2={toY}
              stroke="url(#gold-line)"
              strokeWidth={1.5}
              opacity={0.5}
            />
          );
        })}

        {/* Lines from level 1 to level 2 */}
        {level2.map((sub, i) => {
          const parentX = l1StartX + sub.parentIdx * (NODE_W + H_GAP) + NODE_W / 2;
          const parentY = l1Y + NODE_H / 2 + 22;
          const childX = l2StartX + i * (NODE_W + H_GAP) + NODE_W / 2;
          const childY = l2Y + NODE_H / 2 - 22;
          return (
            <line
              key={`l1-${sub.id}`}
              x1={parentX}
              y1={parentY}
              x2={childX}
              y2={childY}
              stroke="url(#gold-line)"
              strokeWidth={1.5}
              opacity={0.35}
            />
          );
        })}

        {/* YOU node */}
        <NodeCircle x={youX} y={youY} label="YOU" isYou />

        {/* Level 1 nodes */}
        {allLevel1.map((node, i) => {
          const x = l1StartX + i * (NODE_W + H_GAP);
          if (node.empty) {
            return <NodeCircle key={node.id} x={x} y={l1Y} label="" isEmpty />;
          }
          return (
            <NodeCircle
              key={node.id}
              x={x}
              y={l1Y}
              label={node.name ?? "User"}
              memberNumber={node.memberNumber}
            />
          );
        })}

        {/* Level 2 nodes */}
        {level2.map((sub, i) => {
          const x = l2StartX + i * (NODE_W + H_GAP);
          return (
            <NodeCircle
              key={sub.id}
              x={x}
              y={l2Y}
              label={sub.name ?? "User"}
              memberNumber={sub.memberNumber}
            />
          );
        })}
      </svg>
    </div>
  );
}
