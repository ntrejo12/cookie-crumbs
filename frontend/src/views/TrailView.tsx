import CategoryBars from "../components/CategoryBars";
import XRayPanel from "../components/XRayPanel";
import { CATEGORY_META, type SiteScan, type Tracker } from "../data/mockScans";

interface ViewProps {
  scan: SiteScan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const card = "rounded-2xl border-2 border-crust bg-cream";

function CategoryDot({ t }: { t: Tracker }) {
  return (
    <span
      className={`h-3 w-3 shrink-0 rounded-full border-2 border-[#1E1209] ${t.category === "unknown" ? "border-dashed" : ""}`}
      style={{ backgroundColor: CATEGORY_META[t.category].color }}
    />
  );
}

const categoryName = (t: Tracker) => (t.category === "unknown" ? "Unconfirmed" : CATEGORY_META[t.category].label);

/** Crumb trail: what kind of crumbs, who dropped the most, and every crumb in a list. */
export default function TrailView({ scan, selectedId, onSelect }: ViewProps) {
  const selected = scan.trackers.find((t) => t.id === selectedId);
  const loadedBy = selected?.via ? scan.trackers.find((t) => t.id === selected.via)?.domain : undefined;
  const topDroppers = [...scan.trackers].sort((a, b) => b.cookies - a.cookies).slice(0, 5);
  const rows = [...scan.trackers].sort((a, b) => b.requests - a.requests);
  const toggle = (id: string) => onSelect(id === selectedId ? null : id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-chip sm:text-4xl">Crumb trail</h1>
        <p className="mt-1 text-cocoa">
          Everyone {scan.domain} phoned home to. Click any crumb to X-ray it.
        </p>
      </header>

      {/* What kind of crumbs + biggest droppers */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="font-serif text-xl font-bold text-chip">What kind of crumbs</h2>
          <p className="mb-4 text-sm text-cocoa">Trackers on this site, by what they do.</p>
          <CategoryBars key={scan.domain} trackers={scan.trackers} />
        </div>

        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="font-serif text-xl font-bold text-chip">Biggest crumb droppers</h2>
          <p className="mb-3 text-sm text-cocoa">The domains that left the most cookies.</p>
          <ul className="divide-y divide-line">
            {topDroppers.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  aria-pressed={t.id === selectedId}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition ${
                    t.id === selectedId ? "bg-dough/25" : "hover:bg-parchment"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <CategoryDot t={t} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-chip">{t.domain}</span>
                      <span className="block text-xs text-cocoa">
                        {categoryName(t)}
                        {t.owner ? ` · ${t.owner}` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-chip">{t.cookies} cookies</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Every crumb + X-Ray */}
      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className={`${card} min-w-0 overflow-hidden`}>
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
                      onClick={() => toggle(t.id)}
                      className={`cursor-pointer border-b border-line/70 transition last:border-0 ${
                        isSel ? "bg-dough/25" : "hover:bg-parchment"
                      }`}
                    >
                      <td className="px-5 py-3 sm:px-6">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(t.id);
                          }}
                          className="font-semibold text-chip hover:underline"
                        >
                          {t.domain}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-chip">
                          <CategoryDot t={t} />
                          {categoryName(t)}
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
        </div>
        <div className="xl:sticky xl:top-6 xl:self-start">
          <XRayPanel tracker={selected} loadedBy={loadedBy} onClose={() => onSelect(null)} />
        </div>
      </section>
    </div>
  );
}
