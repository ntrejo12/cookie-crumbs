import { CATEGORY_META, CATEGORY_ORDER, countByCategory, type Category, type Tracker } from "../data/mockScans";

interface CategoryBarsProps {
  trackers: Tracker[];
  /** Pass a shared max when comparing sites so bars use the same scale */
  max?: number;
}

/** Horizontal bars of tracker counts per category, like the mockup. */
export default function CategoryBars({ trackers, max }: CategoryBarsProps) {
  const counts = countByCategory(trackers);
  const cats: Category[] = counts.unknown ? [...CATEGORY_ORDER, "unknown"] : CATEGORY_ORDER;
  const top = max ?? Math.max(1, ...cats.map((c) => counts[c]));

  return (
    <ul className="space-y-3">
      {cats.map((c, i) => (
        <li key={c} className="grid grid-cols-[6.5rem_1fr_1.75rem] items-center gap-3 sm:grid-cols-[7.5rem_1fr_2rem]">
          <span className="text-sm text-chip">{CATEGORY_META[c].label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-line/60">
            <span
              className="block h-full origin-left rounded-full motion-safe:animate-grow"
              style={{
                width: `${(counts[c] / top) * 100}%`,
                backgroundColor: CATEGORY_META[c].color,
                animationDelay: `${i * 80}ms`,
                // unknown bar gets a hatched look to show it's an estimate
                backgroundImage:
                  c === "unknown"
                    ? "repeating-linear-gradient(135deg, transparent 0 4px, rgba(61,38,24,.25) 4px 6px)"
                    : undefined,
              }}
            />
          </span>
          <span className="text-right text-sm font-bold tabular-nums text-chip">{counts[c]}</span>
        </li>
      ))}
    </ul>
  );
}
