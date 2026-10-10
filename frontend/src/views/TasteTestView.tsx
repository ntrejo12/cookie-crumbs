import { useState } from "react";
import CategoryBars from "../components/CategoryBars";
import CookieScore from "../components/CookieScore";
import SitePicker from "../components/SitePicker";
import { CATEGORY_ORDER, countByCategory, scoreLabel, type SiteScan } from "../data/mockScans";

/** Taste test: two sites side by side, same scale, so you can see which is crumbier. */
export default function TasteTestView({ scans }: { scans: SiteScan[] }) {
  const [leftDomain, setLeftDomain] = useState(scans[1]?.domain ?? scans[0].domain);
  const [rightDomain, setRightDomain] = useState(scans[2]?.domain ?? scans[0].domain);
  const left = scans.find((s) => s.domain === leftDomain) ?? scans[0];
  const right = scans.find((s) => s.domain === rightDomain) ?? scans[0];

  // shared scale so a long bar on one side means the same thing on the other
  const max = Math.max(
    1,
    ...[left, right].flatMap((s) => {
      const c = countByCategory(s.trackers);
      return [...CATEGORY_ORDER.map((k) => c[k]), c.unknown];
    }),
  );

  const crumbier = left.score === right.score ? null : left.score > right.score ? left : right;
  const other = crumbier === left ? right : left;
  const ratio = crumbier ? (crumbier.trackers.length / Math.max(1, other.trackers.length)).toFixed(1) : null;

  const side = (scan: SiteScan, pick: string, setPick: (d: string) => void, label: string) => (
    <div className={`rounded-2xl border-2 bg-cream p-5 sm:p-7 ${crumbier === scan ? "border-ad" : "border-crust"}`}>
      <SitePicker scans={scans} value={pick} onChange={setPick} label={label} />
      <div className="mt-5 flex items-center gap-4">
        <CookieScore key={scan.domain} score={scan.score} size={92} />
        <div className="min-w-0">
          <h2 className="break-all font-serif text-2xl font-bold text-chip">{scan.domain}</h2>
          <p className="text-sm text-cocoa">{scoreLabel(scan.score)}</p>
          <p className="mt-1 text-sm font-semibold text-chip">
            {scan.trackers.length} trackers · {scan.cookies} cookies
          </p>
        </div>
      </div>
      <div className="mt-6">
        <CategoryBars key={scan.domain} trackers={scan.trackers} max={max} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-chip sm:text-4xl">Taste test: which site is crumbier?</h1>
        <p className="mt-1 text-cocoa">Pick two sites you've scanned and compare what they leave behind.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {side(left, leftDomain, setLeftDomain, "First site")}
        {side(right, rightDomain, setRightDomain, "Second site")}
      </section>

      <p className="rounded-2xl bg-cream px-5 py-4 text-center font-semibold text-chip" aria-live="polite">
        {left.domain === right.domain
          ? "Pick two different sites to compare."
          : crumbier
            ? `${crumbier.domain} is crumbier, with ${ratio}x the trackers of ${other.domain}.`
            : "It's a tie. Both leave the same amount of crumbs."}
      </p>

      <div className="rounded-2xl bg-chip px-6 py-4 text-cream">
        <span className="font-serif font-bold">Cookie class: </span>A third-party cookie is a crumb dropped by someone other
        than the site you visited.
      </div>
    </div>
  );
}
