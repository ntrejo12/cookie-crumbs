import { useState } from "react";
import { countByCategory, type Category, type SiteScan } from "../data/mockScans";

/**
 * Crumb Test, laid out exactly like the Canva mockup: two hands dunking cookies into milk,
 * the tracker counts floating in the milk, and color-coded labels with arrows in the middle.
 *
 * Everything is placed on a fixed-ratio "stage" (1030 x 755, the mockup's canvas size) using
 * the mockup's own coordinates, so the whole scene scales together on any screen.
 */
const W = 1030;
const H = 755;
const px = (x: number) => `${(x / W) * 100}%`;
const py = (y: number) => `${(y / H) * 100}%`;
const fs = (size: number) => `${(size / W) * 100}cqw`; // font size that scales with the stage

// rows in the mockup order, with the label colors sampled from it
const ROWS: { cat: Category; label: string; color: string; y: number; labelL: number; labelR: number }[] = [
  { cat: "analytics", label: "ANALYTICS", color: "#E2A39E", y: 542, labelL: 448, labelR: 580 },
  { cat: "advertising", label: "ADVERTISING", color: "#A9C190", y: 574, labelL: 435, labelR: 593 },
  { cat: "social", label: "SOCIAL", color: "#9CCAD1", y: 606, labelL: 470, labelR: 558 },
  { cat: "fingerprint", label: "FINGERPRINT", color: "#EBB98B", y: 637, labelL: 436, labelR: 592 },
  { cat: "unknown", label: "UNKNOWN", color: "#6E6E6E", y: 668, labelL: 448, labelR: 580 },
];
const NUM_X_LEFT = 256; // middle of the left glass
const NUM_X_RIGHT = 789; // middle of the right glass
const ARROW_END_LEFT = 288;
const ARROW_END_RIGHT = 747;

function SitePickerText({
  scans,
  value,
  onChange,
  label,
}: {
  scans: SiteScan[];
  value: string;
  onChange: (d: string) => void;
  label: string;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-md bg-transparent pr-[1.1em] text-center font-hand text-chip outline-none transition hover:bg-black/5 focus-visible:ring-4 focus-visible:ring-dough/40"
        style={{ fontSize: fs(19) }}
      >
        {scans.map((s) => (
          <option key={s.domain} value={s.domain} className="font-sans text-base">
            {s.domain}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute right-0 h-[0.9em] w-[0.9em]" style={{ fontSize: fs(19) }}>
        <path d="M5.5 7.5 10 12l4.5-4.5" stroke="#6B4A2E" strokeWidth="2" fill="none" />
      </svg>
    </label>
  );
}

export default function TasteTestView({ scans }: { scans: SiteScan[] }) {
  const [leftDomain, setLeftDomain] = useState(scans[1]?.domain ?? scans[0].domain);
  const [rightDomain, setRightDomain] = useState(scans[2]?.domain ?? scans[0].domain);
  const left = scans.find((s) => s.domain === leftDomain) ?? scans[0];
  const right = scans.find((s) => s.domain === rightDomain) ?? scans[0];
  const leftCounts = countByCategory(left.trackers);
  const rightCounts = countByCategory(right.trackers);

  // the "winner" spot in the mockup: who's crumbier, between the two titles
  const winner =
    left.domain === right.domain
      ? { title: "Pick two different sites", sub: "" }
      : left.trackers.length === right.trackers.length
        ? { title: "It's a tie!", sub: "Same number of trackers" }
        : (() => {
            const [more, less] = left.trackers.length > right.trackers.length ? [left, right] : [right, left];
            const ratio = (more.trackers.length / Math.max(1, less.trackers.length)).toFixed(1);
            return { title: `${more.domain} is crumbier`, sub: `${ratio}x the trackers` };
          })();

  const header = (n: 1 | 2, scan: SiteScan, set: (d: string) => void, cx: number, top: number) => (
    <div className="absolute flex -translate-x-1/2 flex-col items-center text-center" style={{ left: px(cx), top: py(top) }}>
      <p className="font-sans font-bold uppercase leading-none tracking-tight text-black" style={{ fontSize: fs(30) }}>
        Cookie {n}
      </p>
      <div className="mt-[0.4em]" style={{ fontSize: fs(19) }}>
        <SitePickerText scans={scans} value={scan.domain} onChange={set} label={`Cookie ${n} website`} />
      </div>
      <p className="font-hand leading-tight text-chip" style={{ fontSize: fs(19) }}>
        {scan.trackers.length} trackers, {scan.cookies} cookies
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-serif text-3xl font-bold text-chip sm:text-4xl">Crumb Test: Which Site Is Crumbier?</h1>
        <p className="mt-1 text-cocoa">Pick two sites you've scanned and compare what they leave behind.</p>
      </header>

      {/* The stage: fixed ratio, everything positioned with the mockup's coordinates */}
      <section
        className="relative w-full [container-type:inline-size]"
        style={{ aspectRatio: `${W} / ${H}` }}
        aria-label={`Comparing ${left.domain} and ${right.domain}`}
      >
        {/* hands dunking cookies */}
        {/* each forearm is stretched out past the stage so the hands reach the edges of the screen */}
        <div className="pointer-events-none absolute select-none" style={{ left: 0, top: py(131), width: px(376) }}>
          <div
            aria-hidden
            className="absolute right-[calc(100%-2px)] top-0 h-full w-[100vw]"
            style={{ backgroundImage: "url(/crumbtest/arm-left.png)", backgroundSize: "auto 100%", backgroundRepeat: "repeat-x" }}
          />
          <img src="/crumbtest/hand-left.png" alt="" draggable={false} className="relative block w-full" />
        </div>
        <div className="pointer-events-none absolute select-none" style={{ right: 0, top: py(131), width: px(357) }}>
          <div
            aria-hidden
            className="absolute left-[calc(100%-2px)] top-0 h-full w-[100vw]"
            style={{ backgroundImage: "url(/crumbtest/arm-right.png)", backgroundSize: "auto 100%", backgroundRepeat: "repeat-x" }}
          />
          <img src="/crumbtest/hand-right.png" alt="" draggable={false} className="relative block w-full" />
        </div>

        {/* milk glasses */}
        <img src="/crumbtest/glass-left.png" alt="" draggable={false} className="pointer-events-none absolute select-none" style={{ left: px(165), top: py(439), width: px(191) }} />
        <img src="/crumbtest/glass-right.png" alt="" draggable={false} className="pointer-events-none absolute select-none" style={{ left: px(693), top: py(427), width: px(191) }} />

        {/* headings */}
        {header(1, left, setLeftDomain, 224, 38)}
        {header(2, right, setRightDomain, 839, 21)}

        {/* winner: between the two titles, slightly below them (same spot as the mockup) */}
        <div
          aria-live="polite"
          className="absolute -translate-x-1/2 -translate-y-1/2 text-center leading-tight"
          style={{ left: px(533), top: py(128), width: px(320) }}
        >
          <img
            src="/popup/cookie-chocchip.svg"
            alt=""
            draggable={false}
            className="mx-auto mb-[0.35em] select-none"
            style={{ width: fs(54), minWidth: 32 }}
          />
          <p className="font-sans font-bold text-black" style={{ fontSize: fs(19) }}>
            {winner.title}
          </p>
          {winner.sub && (
            <p className="font-hand text-chip" style={{ fontSize: fs(16) }}>
              {winner.sub}
            </p>
          )}
        </div>

        {/* labels, arrows and the counts in the milk */}
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            {ROWS.map((r) => (
              <marker key={r.cat} id={`arrow-${r.cat}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,1 L10,5 L0,9 z" fill={r.color} />
              </marker>
            ))}
          </defs>
          {ROWS.map((r) => (
            <g key={r.cat}>
              <line x1={r.labelL - 12} y1={r.y} x2={ARROW_END_LEFT} y2={r.y} stroke={r.color} strokeWidth="2" markerEnd={`url(#arrow-${r.cat})`} />
              <line x1={r.labelR + 12} y1={r.y} x2={ARROW_END_RIGHT} y2={r.y} stroke={r.color} strokeWidth="2" markerEnd={`url(#arrow-${r.cat})`} />
              <text
                x={(r.labelL + r.labelR) / 2}
                y={r.y}
                textAnchor="middle"
                dominantBaseline="central"
                textLength={r.labelR - r.labelL}
                lengthAdjust="spacingAndGlyphs"
                fontFamily="DM Sans, system-ui, sans-serif"
                fontWeight="700"
                fontSize="25"
                fill={r.color}
              >
                {r.label}
              </text>
              <text x={NUM_X_LEFT} y={r.y} textAnchor="middle" dominantBaseline="central" fontFamily="DM Sans, system-ui, sans-serif" fontWeight="700" fontSize="24" fill={r.color}>
                {leftCounts[r.cat]}
              </text>
              <text x={NUM_X_RIGHT} y={r.y} textAnchor="middle" dominantBaseline="central" fontFamily="DM Sans, system-ui, sans-serif" fontWeight="700" fontSize="24" fill={r.color}>
                {rightCounts[r.cat]}
              </text>
            </g>
          ))}
        </svg>

        {/* readable version of the same numbers for screen readers */}
        <table className="sr-only">
          <caption>Trackers by category</caption>
          <thead>
            <tr>
              <th>Category</th>
              <th>{left.domain}</th>
              <th>{right.domain}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.cat}>
                <th>{r.label}</th>
                <td>{leftCounts[r.cat]}</td>
                <td>{rightCounts[r.cat]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
