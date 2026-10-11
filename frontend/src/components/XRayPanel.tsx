import type { ReactNode } from "react";
import {
  CATEGORY_META,
  type Tracker,
} from "../data/mockScans";
import type { AITrackerClassification } from "../lib/aiApi";
import { toDashboardCategory } from "../lib/trackerClassification";

interface XRayPanelProps {
  tracker: Tracker | undefined;
  classification?: AITrackerClassification;
  loadedBy?: string;
  onClose: () => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/70 py-2.5 text-sm last:border-0">
      <dt className="text-cocoa">{label}</dt>
      <dd className="text-right font-semibold text-chip">
        {children}
      </dd>
    </div>
  );
}

export default function XRayPanel({
  tracker,
  classification,
  loadedBy,
  onClose,
}: XRayPanelProps) {
  if (!tracker) {
    return (
      <aside className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-cream/60 p-6 text-center">
        <span aria-hidden className="text-4xl">🔍</span>

        <h3 className="mt-3 font-serif text-lg font-bold text-chip">
          Privacy X-Ray
        </h3>

        <p className="mt-1 text-sm text-cocoa">
          Pick any crumb to see who it is,
          what it does, and how sure we are.
        </p>
      </aside>
    );
  }

  const known = classification
    ? classification.verified &&
      classification.source === "known_list"
    : tracker.known;

  const category =
    classification && known
      ? toDashboardCategory(classification.category) ??
        tracker.category
      : tracker.category;

  const categoryMeta = CATEGORY_META[category];

  const owner =
    classification?.company && known
      ? classification.company
      : tracker.owner ?? null;

  const sourceLabel = (() => {
    switch (classification?.source) {
      case "known_list":
        return "Known tracker database";
      case "model":
        return "Model prediction";
      case "heuristic":
        return "Heuristic estimate";
      default:
        return "Not available";
    }
  })();

  const predictedCategory =
    classification && !known
      ? toDashboardCategory(classification.category)
      : null;

  const confidence =
    classification?.confidence != null &&
    Number.isFinite(classification.confidence)
      ? Math.round(
          Math.max(
            0,
            Math.min(1, classification.confidence),
          ) * 100,
        )
      : null;

  const legacyAI = !classification ? tracker.ai : undefined;

  return (
    <aside
      aria-live="polite"
      className="rounded-2xl border-2 border-crust bg-cream p-5 shadow-[0_8px_24px_rgba(61,38,24,0.12)] motion-safe:animate-fade"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-crust">
            Privacy X-Ray
          </p>

          <h3 className="mt-1 break-all font-serif text-xl font-bold text-chip">
            {tracker.domain}
          </h3>
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
        <Row label="Observed category">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full border border-[#1E1209] ${
                category === "unknown" ? "border-dashed" : ""
              }`}
              style={{ backgroundColor: categoryMeta.color }}
            />

            {category === "unknown"
              ? "Unconfirmed"
              : categoryMeta.label}
          </span>
        </Row>

        <Row label="Requests observed">
          {tracker.requests}
        </Row>

        <Row label="Cookies attributed">
          {tracker.cookies ?? "Not measured"}
        </Row>

        <Row label="Known tracker list">
          {known ? (
            <span className="text-[#3E7A3A]">Yes</span>
          ) : (
            <span className="text-ad">Not confirmed</span>
          )}
        </Row>

        <Row label="Company / owner">
          {owner ?? "Not verified"}
        </Row>

        {loadedBy && (
          <Row label="Loaded by">{loadedBy}</Row>
        )}

        {classification && (
          <>
            <Row label="Classification source">
              {sourceLabel}
            </Row>

            <Row label="Risk estimate">
              {classification.risk_level ?? "Unknown"}
            </Row>
          </>
        )}
      </dl>

      {classification && (
        <div className="mt-4 rounded-xl bg-parchment p-3.5">
          <h4 className="text-sm font-bold text-chip">
            Classification Details
          </h4>

          {predictedCategory && (
            <p className="mt-2 text-sm text-chip">
              Estimated category:{" "}
              <strong>
                {CATEGORY_META[predictedCategory].label}
              </strong>
            </p>
          )}

          {!known && (
            <p className="mt-2 text-xs text-cocoa">
              This classification is an unverified estimate,
              not proof that the domain is a tracker
              or is malicious.
            </p>
          )}

          {confidence !== null && (
            <div className="mt-3">
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-cocoa">
                  Reported confidence
                </span>
                <span className="font-bold text-crust">
                  {confidence}%
                </span>
              </div>

              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-line"
                role="meter"
                aria-label="Reported classification confidence"
                aria-valuenow={confidence}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-crust"
                  style={{ width: `${confidence}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-cocoa">
                This is the classifier's reported score,
                not a calibrated probability of maliciousness.
              </p>
            </div>
          )}

          {classification.explanation && (
            <p className="mt-3 text-sm text-chip">
              {classification.explanation}
            </p>
          )}

          {!classification.explanation && (
            <p className="mt-3 text-sm text-cocoa">
              No domain-specific explanation is available.
            </p>
          )}
        </div>
      )}

      {legacyAI && (
        <div className="mt-4 rounded-xl bg-parchment p-3.5">
          <h4 className="text-sm font-bold text-chip">
            Estimated classification
          </h4>

          <p className="mt-2 text-sm text-chip">
            {CATEGORY_META[legacyAI.guess].label} (
            {Math.round(legacyAI.confidence * 100)}%)
          </p>

          <p className="mt-2 text-sm text-cocoa">
            {legacyAI.reason}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h4 className="text-sm font-bold text-chip">
          Why It Matters
        </h4>

        <p className="mt-1 text-sm text-cocoa">
          {category === "unknown"
            ? "This domain was contacted during the scan, but its tracking purpose has not been verified."
            : categoryMeta.why}
        </p>
      </div>
    </aside>
  );
}
