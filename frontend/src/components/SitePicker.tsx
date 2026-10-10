import type { SiteScan } from "../data/mockScans";

interface SitePickerProps {
  scans: SiteScan[];
  value: string;
  onChange: (domain: string) => void;
  label?: string;
}

/** Pill-shaped dropdown for choosing which scanned site to look at. */
export default function SitePicker({ scans, value, onChange, label = "Scanned site" }: SitePickerProps) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border-2 border-crust bg-cream py-2 pl-4 pr-10 text-sm font-semibold text-chip outline-none transition focus:ring-4 focus:ring-dough/40"
      >
        {scans.map((s) => (
          <option key={s.domain} value={s.domain}>
            {s.domain}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute right-3.5 h-4 w-4 fill-chip">
        <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="2" fill="none" className="stroke-chip" />
      </svg>
    </label>
  );
}
