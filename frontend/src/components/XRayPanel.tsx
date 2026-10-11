import type { ReactNode } from "react";
import { CATEGORY_META, type Tracker } from "../data/mockScans";

interface XRayPanelProps {
  tracker: Tracker | undefined;
  /** domain of the tracker that loaded this one, if any */
  loadedBy?: string;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/70 py-2.5 text-sm last:border-0">
      <dt className="text-cocoa">{label}</dt>
      <dd className="text-right font-semibold text-chip">{children}</dd>
    </div>
  );
}

/** Privacy X-Ray: everything we know (and don't) about one crumb. */
export default function XRayPanel({ tracker, loadedBy, onClose }: XRayPanelProps) {
  if (!tracker) {
    return (
      <aside className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-cream/60 p-6 text-center">
        <span aria-hidden className="text-4xl">🔍</span>
        <h3 className="mt-3 font-serif text-lg font-bold text-chip">Privacy X-Ray</h3>
        <p className="mt-1 text-sm text-cocoa">
          Pick any crumb to see who it is, what it does, and how sure we are.
        </p>
      </aside>
    );
  }

  const unknown = tracker.category === "unknown";
  const effective = tracker.ai?.guess ?? tracker.category;
  const meta = CATEGORY_META[tracker.category];
  const pct = tracker.ai ? Math.round(tracker.ai.confidence * 100) : 0;

  return (
    <aside
      aria-live="polite"
      className="rounded-2xl border-2 border-crust bg-cream p-5 shadow-[0_8px_24px_rgba(61,38,24,0.12)] motion-safe:animate-fade"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-crust">Privacy X-Ray</p>
          <h3 className="mt-1 break-all font-serif text-xl font-bold text-chip">{tracker.domain}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close X-Ray"
          className="-mr-1 rounded-lg px-2 py-1 text-lg leading-none text-cocoa transition hover:bg-line/50"
        >
          ×
        </button>
      </div>

      <dl className="mt-3">
        <Row label="Category">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full border border-[#1E1209] ${unknown ? "border-dashed" : ""}`}
              style={{ backgroundColor: meta.color }}
            />
            {unknown ? "Unconfirmed" : meta.label}
          </span>
        </Row>
        <Row label="Requests observed">{tracker.requests}</Row>
        <Row label="Cookies set">{tracker.cookies}</Row>
        <Row label="On known tracker list">
          {tracker.known ? <span className="text-[#3E7A3A]">Yes</span> : <span className="text-ad">No</span>}
        </Row>
        {tracker.owner && <Row label="Owned by">{tracker.owner}</Row>}
        {loadedBy && <Row label="Loaded by">{loadedBy}</Row>}
      </dl>

      {tracker.ai && (
        <div className="mt-4 rounded-xl bg-parchment p-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-chip">
              AI's best guess: {CATEGORY_META[tracker.ai.guess].label}
            </span>
            <span className="font-bold tabular-nums text-crust">{pct}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-line"
            role="meter"
            aria-label="Model confidence"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full origin-left rounded-full bg-crust motion-safe:animate-grow" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2.5 text-sm text-chip">{tracker.ai.reason}</p>
          <p className="mt-2 text-xs text-cocoa">
            This is an estimate from request patterns, not a confirmed match. We don't call it malicious without proof.
          </p>
        </div>
      )}

      <div className="mt-4">
        <h4 className="text-sm font-bold text-chip">Why it matters</h4>
        <p className="mt-1 text-sm text-cocoa">
          {unknown ? `If the guess is right: ${CATEGORY_META[effective].why}` : meta.why}
        </p>
      </div>
    </aside>
  );
}
