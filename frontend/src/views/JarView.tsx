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
export default function JarView({
  scan,
  selectedId,
  onSelect,
}: ViewProps) {
  const selected = scan.trackers.find(
    (t) => t.id === selectedId,
  );

  const loadedBy = selected?.via
    ? scan.trackers.find(
        (t) => t.id === selected.via,
      )?.domain
    : undefined;

  const knownTrackers = scan.trackers.filter((t) => t.known);

  const topRequestDomains = [...scan.trackers]
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 4);

  const stats = [
    {
      label: "Page-accessible cookies",
      value: scan.cookies,
    },
    {
      label: "Known trackers",
      value: knownTrackers.length,
    },
    {
      label: "3rd-party requests",
      value: scan.thirdPartyRequests,
    },
    {
      label: "Permissions",
      value: scan.permissions?.length ?? "N/A",
      hint: scan.permissions?.join(", ") ||
        "Not measured yet",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-5">
        <CookieScore
          key={scan.domain}
          score={scan.score}
          size={104}
        />

        <div className="min-w-0">
          <h1 className="break-all font-serif
                         text-3xl font-bold text-chip
                         sm:text-4xl">
            {scan.domain}
          </h1>

          <p className="mt-1 text-cocoa">
            {scan.score === null
              ? "Crumb Score pending. "
              : `Crumb score ${scan.score}: ${
                  scoreLabel(scan.score).toLowerCase()
                }. `}
            {knownTrackers.length} known trackers
            identified in observed requests.
          </p>
        </div>
      </header>

      <section
        className="grid grid-cols-2 gap-3
                   sm:gap-4 xl:grid-cols-4"
        aria-label="Scan totals"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${card} px-5 py-4`}
            title={stat.hint}
          >
            <p className="text-sm text-cocoa">
              {stat.label}
            </p>
            <p className="mt-1 font-serif text-3xl
                          font-bold tabular-nums text-chip
                          sm:text-4xl">
              {stat.value}
            </p>
            {stat.hint && (
              <p className="mt-1 truncate text-xs text-cocoa">
                {stat.hint}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="grid gap-4
                          xl:grid-cols-[1fr_320px]">
        <div className={`${card} min-w-0 p-5 sm:p-6`}>
          <h2 className="font-serif text-xl
                         font-bold text-chip">
            The crumb trail
          </h2>
          <p className="text-sm text-cocoa">
            Select a domain to inspect the requests observed.
          </p>

          <div className="-mx-2 mt-2 overflow-x-auto px-2">
            <CrumbTrail
              scan={scan}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </div>

          <TrailLegend />
        </div>

        <XRayPanel
          tracker={selected}
          loadedBy={loadedBy}
          onClose={() => onSelect(null)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="font-serif text-xl
                         font-bold text-chip">
            What kind of crumbs
          </h2>
          <p className="mb-4 text-sm text-cocoa">
            Third-party domains categorized by tracker type.
          </p>

          <CategoryBars trackers={scan.trackers} />
        </div>

        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="font-serif text-xl
                         font-bold text-chip">
            Most requested domains
          </h2>
          <p className="mb-3 text-sm text-cocoa">
            Third-party domains with the most observed requests.
          </p>

          <ul className="divide-y divide-line">
            {topRequestDomains.map((tracker) => (
              <li key={tracker.id}>
                <button
                  type="button"
                  onClick={() => onSelect(tracker.id)}
                  className="flex w-full items-center
                             justify-between gap-3 rounded-lg
                             px-2 py-3 text-left
                             hover:bg-parchment"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full
                                 border-2 border-[#1E1209]"
                      style={{
                        backgroundColor:
                          CATEGORY_META[tracker.category].color,
                      }}
                    />

                    <span className="min-w-0">
                      <span className="block truncate
                                       font-semibold text-chip">
                        {tracker.domain}
                      </span>

                      <span className="block text-xs text-cocoa">
                        {CATEGORY_META[tracker.category].label}
                      </span>
                    </span>
                  </span>

                  <span className="shrink-0 text-sm
                                   font-bold text-chip">
                    {tracker.requests} requests
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
