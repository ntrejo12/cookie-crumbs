import CategoryBars from "../components/CategoryBars";
import CookieScore from "../components/CookieScore";
import CrumbTrail, { TrailLegend } from "../components/CrumbTrail";
import XRayPanel from "../components/XRayPanel";
import { CATEGORY_META, scoreLabel, type SiteScan } from "../data/mockScans";

interface ViewProps {
  scan: SiteScan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const card = "rounded-2xl border-2 border-crust bg-cream";

/** Cookie jar: the overview for one site. */
export default function JarView({ scan, selectedId, onSelect }: ViewProps) {
  const selected = scan.trackers.find((t) => t.id === selectedId);
  const loadedBy = selected?.via ? scan.trackers.find((t) => t.id === selected.via)?.domain : undefined;
  const topDroppers = [...scan.trackers].sort((a, b) => b.cookies - a.cookies).slice(0, 4);

  const stats = [
    { label: "Cookies", value: scan.cookies },
    { label: "Trackers", value: scan.trackers.length },
    { label: "3rd-party requests", value: scan.thirdPartyRequests },
    { label: "Permissions", value: scan.permissions.length, hint: scan.permissions.join(", ") || "None requested" },
  ];

  return (
    <div className="space-y-6">
      {/* Score header */}
      <header className="flex items-center gap-5">
        <CookieScore key={scan.domain} score={scan.score} size={104} />
        <div className="min-w-0">
          <h1 className="break-all font-serif text-3xl font-bold text-chip sm:text-4xl">{scan.domain}</h1>
          <p className="mt-1 text-cocoa">
            Crumb score {scan.score}: {scoreLabel(scan.score).toLowerCase()}. {scan.trackers.length} trackers followed you here.
          </p>
        </div>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Scan totals">
        {stats.map((s) => (
          <div key={s.label} className={`${card} px-5 py-4`} title={s.hint}>
            <p className="text-sm text-cocoa">{s.label}</p>
            <p className="mt-1 font-serif text-3xl font-bold tabular-nums text-chip sm:text-4xl">{s.value}</p>
            {s.hint && <p className="mt-1 truncate text-xs text-cocoa">{s.hint}</p>}
          </div>
        ))}
      </section>

      {/* Crumb trail + X-Ray */}
      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className={`${card} min-w-0 p-5 sm:p-6`}>
          <h2 className="font-serif text-xl font-bold text-chip">The crumb trail</h2>
          <p className="text-sm text-cocoa">Tap a crumb to see who it phones home to.</p>
          <div className="-mx-2 mt-2 overflow-x-auto px-2">
            <CrumbTrail scan={scan} selectedId={selectedId} onSelect={onSelect} />
          </div>
          <TrailLegend />
        </div>
        <XRayPanel tracker={selected} loadedBy={loadedBy} onClose={() => onSelect(null)} />
      </section>

      {/* Breakdown + biggest droppers */}
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
                  onClick={() => onSelect(t.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-parchment"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border-2 border-[#1E1209]"
                      style={{ backgroundColor: CATEGORY_META[t.category].color }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-chip">{t.domain}</span>
                      <span className="block text-xs text-cocoa">
                        {t.category === "unknown" ? "Unconfirmed" : CATEGORY_META[t.category].label}
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
    </div>
  );
}
