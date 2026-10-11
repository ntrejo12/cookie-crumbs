import { useEffect, useRef, useState } from "react";
import CookieScore from "../components/CookieScore";
import Oven from "../components/Oven";
import CrumbTrail, { TrailLegend } from "../components/CrumbTrail";
import XRayPanel from "../components/XRayPanel";
import { scoreLabel, type SiteScan } from "../data/mockScans";
import PrivacyDetails from "../components/PrivacyDetails";
import AIPrivacyDetective from "../components/AIPrivacyDetective";
import type { AIAnalysisResponse } from "../lib/aiApi";
import { findTrackerClassification } from "../lib/trackerClassification";
import { classifyUnfamiliarDomains } from "../lib/classifyApi";

interface ViewProps {
  scan: SiteScan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const card = "rounded-2xl border-2 border-crust bg-cream";

const GRAPH_MAX = 500; // the graph's original size
const GRAPH_MIN = 220; // never squash it smaller than this (short screens scroll a little instead)

/** Cookie jar: the overview for one site. */
export default function JarView({scan, selectedId, onSelect,}: ViewProps) {
  // Full AI privacy analysis
  const [aiResult, setAiResult] = useState<AIAnalysisResponse | null>(null);

  const [analyzedScan, setAnalyzedScan] = useState<SiteScan | null>(null);

  // Hugging Face domain classification
  const [domainClassifications, setDomainClassifications] = useState<AIAnalysisResponse["tracker_classifications"]>([]);

  const [classifying, setClassifying] = useState(false);

  const [classificationError, setClassificationError] = useState<string | null>(null);

  const [classifiedScan, setClassifiedScan] = useState<SiteScan | null>(null);

  // Selected tracker
  const selected = scan.trackers.find((tracker) => tracker.id === selectedId,);

  const loadedBy = selected?.via ? scan.trackers.find((tracker) => tracker.id === selected.via,)?.domain: undefined;

  // Combine standalone classifications with full AI analysis.
  const classifications = [...(classifiedScan === scan ? domainClassifications : []), ...(analyzedScan === scan
    ? aiResult?.tracker_classifications ?? []: []),
  ];

  const selectedClassification = selected ? findTrackerClassification( selected.domain, classifications, ) : undefined;

  function handleAIAnalysisComplete(analysis: AIAnalysisResponse,
  ) {setAiResult(analysis);setAnalyzedScan(scan);}

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

  async function handleClassify() {setClassifying(true); setClassificationError(null);
    try {
      const results = await classifyUnfamiliarDomains(scan);
      setDomainClassifications(results);
      setClassifiedScan(scan);
    } catch (error) {setClassificationError(
      error instanceof Error ? error.message : "Unable to classify domains.",);
    } finally {setClassifying(false);}
  }

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

      <section className={`${card} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-chip">
              Identify Unfamiliar Crumbs
            </h2>

            <p className="mt-1 text-sm text-cocoa">
              Use Hugging Face to estimate what unfamiliar third-party services might do.
            </p>
          </div>

          <button type="button" onClick={handleClassify} disabled={classifying} className="rounded-xl bg-crust px-5 py-2.5 font-semibold text-cream disabled:opacity-50">
            {classifying
              ? "Identifying crumbs..." : "Identify with AI"}
          </button>
        </div>

        {classificationError && (
          <p role="alert" className="mt-3 text-sm text-ad">
            {classificationError}
          </p>
        )}

        {classifiedScan === scan && (
          <p className="mt-3 text-sm text-cocoa">
            {domainClassifications.filter((item) => item.source === "model",).length} model predictions received.
            Select a crumb to inspect the classification and its uncertainty in Privacy X-Ray.
          </p>
        )}
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
        <XRayPanel tracker={selected} classification={selectedClassification} loadedBy={loadedBy} onClose={() => onSelect(null)}/>
      </section>
      <PrivacyDetails scan={scan} />
      <AIPrivacyDetective scan={scan} onAnalysisComplete={handleAIAnalysisComplete}/>
    </div>
  );
}
