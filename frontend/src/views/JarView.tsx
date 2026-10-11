import { useEffect, useRef, useState } from "react";
import CookieScore from "../components/CookieScore";
import Oven from "../components/Oven";
import CrumbTrail, { TrailLegend } from "../components/CrumbTrail";
import XRayPanel from "../components/XRayPanel";
import { scoreLabel, type SiteScan } from "../data/mockScans";
import PrivacyDetails from "../components/PrivacyDetails";
import AIPrivacyDetective from "../components/AIPrivacyDetective";

interface ViewProps {
  scan: SiteScan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const card = "rounded-2xl border-2 border-crust bg-cream";

const GRAPH_MAX = 500; // the graph's original size
const GRAPH_MIN = 220; // never squash it smaller than this (short screens scroll a little instead)

/** Cookie jar: the overview for one site. */
export default function JarView({ scan, selectedId, onSelect }: ViewProps) {
  const selected = scan.trackers.find((t) => t.id === selectedId);
  const loadedBy = selected?.via ? scan.trackers.find((t) => t.id === selected.via)?.domain : undefined;

  // Size the graph so the whole oven fits on screen without scrolling
  const ovenRef = useRef<HTMLDivElement>(null);
  const [graphHeight, setGraphHeight] = useState(GRAPH_MAX);
  useEffect(() => {
    const fit = () => {
      const oven = ovenRef.current;
      if (!oven) return;
      const graph = oven.querySelector<HTMLElement>("[data-crumb-graph]");
      const ovenTop = oven.getBoundingClientRect().top + window.scrollY;
      const restOfOven = oven.offsetHeight - (graph?.offsetHeight ?? 0); // panel, legend, padding
      const room = window.innerHeight - ovenTop - restOfOven - 16;
      setGraphHeight(Math.round(Math.max(GRAPH_MIN, Math.min(GRAPH_MAX, room))));
    };
    fit();
    const raf = requestAnimationFrame(fit); // once more after fonts/images settle
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, []);

  const knownTrackers = scan.trackers.filter((t) => t.known);

  const stats = [
    { label: "Page-accessible cookies", value: scan.cookies },
    { label: "Known trackers", value: knownTrackers.length },
    { label: "3rd-party requests", value: scan.thirdPartyRequests },
    {
      label: "Allowed settings",
      value: scan.permissionSettings
        ? Object.values(scan.permissionSettings).some(
            (setting) => setting === "unknown",
          )
          ? "N/A"
          : Object.values(scan.permissionSettings).filter(
              (setting) => setting === "allow",
            ).length
        : "N/A",
      hint: "Allowed Chrome settings among location, notifications, camera, and microphone",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Score header */}
      <header className="flex items-center gap-5">
        <CookieScore key={scan.domain} score={scan.score} size={84} />
        <div className="min-w-0">
          <h1 className="break-all font-serif text-3xl font-bold text-chip sm:text-4xl">{scan.domain}</h1>
          <p className="mt-1 text-cocoa">
            {scan.score === null
              ? "Crumb Score pending. "
              : `Crumb score ${scan.score}: ${scoreLabel(scan.score).toLowerCase()}. `}
            {knownTrackers.length} known trackers identified in observed requests.
          </p>
        </div>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Scan totals">
        {stats.map((s) => (
          <div key={s.label} className={`${card} px-5 py-3`} title={s.hint}>
            <p className="text-sm text-cocoa">{s.label}</p>
            <p className="font-serif text-3xl font-bold tabular-nums text-chip">{s.value}</p>
            {s.hint && <p className="truncate text-xs text-cocoa">{s.hint}</p>}
          </div>
        ))}
      </section>

      {/* Crumb trail + X-Ray */}
      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div ref={ovenRef} className="min-w-0">
        <Oven title="The Crumb Trail">
          <div className="px-3 pb-3 pt-3 sm:px-5">
          <div className="-mx-2 overflow-x-auto px-2">
            <CrumbTrail scan={scan} selectedId={selectedId} onSelect={onSelect} height={graphHeight} />
          </div>
          <TrailLegend />
          </div>
        </Oven>
        </div>
        <XRayPanel tracker={selected} loadedBy={loadedBy} onClose={() => onSelect(null)} />
      </section>
      <PrivacyDetails scan={scan} />
      <AIPrivacyDetective scan={scan} />
    </div>
  );
}
