import { useState } from "react";
import type { SiteScan } from "../data/mockScans";
import {
  analyzeSiteWithAI,
  type AIAnalysisResponse,
} from "../lib/aiApi";

interface Props {
  scan: SiteScan;
  authenticatedHeaders?: Record<string, string>;
}

export default function AIPrivacyDetective({
  scan,
  authenticatedHeaders,
}: Props) {
  const [result, setResult] =
    useState<AIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!authenticatedHeaders) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeSiteWithAI(
        scan,
        authenticatedHeaders,
      );
      setResult(analysis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze this scan.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-crust bg-cream p-5">
      <h2 className="font-serif text-2xl font-bold text-chip">
        AI Privacy Detective
      </h2>

      <p className="mt-2 text-sm text-cocoa">
        Get an explanation of the tracking activity
        observed on this website.
      </p>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading || !authenticatedHeaders}
        className="mt-4 rounded-xl bg-crust px-5 py-2.5 font-semibold text-cream disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze this website"}
      </button>

      {!authenticatedHeaders && (
        <p className="mt-3 text-sm text-cocoa">
          Verified account access is required before
          cloud AI analysis can be enabled.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-ad">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-5 space-y-4">
          <p className="text-xs font-semibold uppercase text-crust">
            {result.generated_by === "model"
              ? "Hugging Face model explanation"
              : "Rule-based explanation"}
          </p>

          <p className="text-sm text-chip">
            {result.explanation}
          </p>

          {result.risk_summary && (
            <p className="text-sm font-semibold text-chip">
              {result.risk_summary}
            </p>
          )}

          {result.uncertainty_note && (
            <p className="text-sm text-cocoa">
              {result.uncertainty_note}
            </p>
          )}

          {result.protections.length > 0 && (
            <div>
              <h3 className="font-bold text-chip">
                What you can do
              </h3>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cocoa">
                {result.protections.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {result.tracker_classifications.length > 0 && (
            <div>
              <h3 className="font-bold text-chip">
                Tracker Classification Details
              </h3>

              <div className="mt-3 space-y-3">
                {result.tracker_classifications.map((tracker) => (
                  <div
                    key={tracker.name}
                    className="rounded-xl bg-parchment p-3"
                  >
                    <p className="break-all font-semibold text-chip">
                      {tracker.name}
                    </p>

                    <p className="mt-1 text-sm text-cocoa">
                      Category: {tracker.category ?? "Unknown"}
                    </p>

                    <p className="text-sm text-cocoa">
                      Owner: {tracker.company ?? "Not verified"}
                    </p>

                    <p className="text-sm text-cocoa">
                      Classification:{" "}
                      {tracker.verified
                        ? "Verified against known data"
                        : "Unverified estimate"}
                    </p>

                    {tracker.confidence !== null && (
                      <p className="text-sm text-cocoa">
                        Reported confidence:{" "}
                        {Math.round(tracker.confidence * 100)}%
                      </p>
                    )}

                    {tracker.explanation && (
                      <p className="mt-2 text-sm text-chip">
                        {tracker.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
