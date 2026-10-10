import CrumbTrail, { TrailLegend } from "../components/CrumbTrail";
import XRayPanel from "../components/XRayPanel";
import { CATEGORY_META, type SiteScan } from "../data/mockScans";

interface ViewProps {
  scan: SiteScan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** Crumb trail: the full tracker graph plus every crumb in a list. */
export default function TrailView({ scan, selectedId, onSelect }: ViewProps) {
  const selected = scan.trackers.find((t) => t.id === selectedId);
  const loadedBy = selected?.via ? scan.trackers.find((t) => t.id === selected.via)?.domain : undefined;
  const rows = [...scan.trackers].sort((a, b) => b.requests - a.requests);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-chip sm:text-4xl">Crumb trail</h1>
        <p className="mt-1 text-cocoa">
          Everyone {scan.domain} phoned home to. Lines out to the edge are trackers loaded by other trackers.
        </p>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-2xl border-2 border-crust bg-cream p-5 sm:p-6">
          <div className="-mx-2 overflow-x-auto px-2">
            <CrumbTrail scan={scan} selectedId={selectedId} onSelect={onSelect} />
          </div>
          <TrailLegend />
        </div>
        <div className="xl:sticky xl:top-6 xl:self-start">
          <XRayPanel tracker={selected} loadedBy={loadedBy} onClose={() => onSelect(null)} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-crust bg-cream">
        <h2 className="px-5 pt-5 font-serif text-xl font-bold text-chip sm:px-6">Every crumb</h2>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[560px] text-left text-sm">
            <thead className="border-b-2 border-line text-xs uppercase tracking-wider text-cocoa">
              <tr>
                <th className="px-5 py-2 font-semibold sm:px-6">Domain</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 text-right font-semibold">Requests</th>
                <th className="px-3 py-2 text-right font-semibold">Cookies</th>
                <th className="px-5 py-2 font-semibold sm:px-6">Tracker list</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const isSel = t.id === selectedId;
                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelect(isSel ? null : t.id)}
                    className={`cursor-pointer border-b border-line/70 transition last:border-0 ${
                      isSel ? "bg-dough/25" : "hover:bg-parchment"
                    }`}
                  >
                    <td className="px-5 py-3 sm:px-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(isSel ? null : t.id);
                        }}
                        className="font-semibold text-chip hover:underline"
                      >
                        {t.domain}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-chip">
                        <span
                          className={`h-2.5 w-2.5 rounded-full border border-[#1E1209] ${t.category === "unknown" ? "border-dashed" : ""}`}
                          style={{ backgroundColor: CATEGORY_META[t.category].color }}
                        />
                        {t.category === "unknown" ? "Unconfirmed" : CATEGORY_META[t.category].label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-chip">{t.requests}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-chip">{t.cookies}</td>
                    <td className="px-5 py-3 sm:px-6">
                      {t.known ? (
                        <span className="text-[#3E7A3A]">Known</span>
                      ) : t.ai ? (
                        <span className="text-cocoa">
                          AI guess: {CATEGORY_META[t.ai.guess].label} ({Math.round(t.ai.confidence * 100)}%)
                        </span>
                      ) : (
                        <span className="text-cocoa">Not listed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
