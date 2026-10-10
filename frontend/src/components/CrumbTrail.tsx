import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { useEffect, useRef } from "react";
import { CATEGORY_META, type SiteScan, type Tracker } from "../data/mockScans";

const SITE_ID = "__site__";
const RING1 = { rx: 255, ry: 150 }; // trackers the site loads directly
const RING2 = { rx: 380, ry: 225 }; // trackers loaded by other trackers

// the site in the middle is drawn as a cookie
const COOKIE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#E3A857" stroke="#BC7A2E" stroke-width="5"/><circle cx="34" cy="34" r="5" fill="#3D2618"/><circle cx="64" cy="30" r="5" fill="#3D2618"/><circle cx="70" cy="58" r="5" fill="#3D2618"/><circle cx="44" cy="66" r="5" fill="#3D2618"/><circle cx="27" cy="54" r="4" fill="#3D2618"/></svg>`,
)}`;

// unknown crumbs get a "?" in the middle
const QUESTION_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><text x="20" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#3D2618">?</text></svg>`,
)}`;

const nodeSize = (requests: number) => Math.round(Math.min(52, 18 + Math.sqrt(requests) * 5.2));

/** Same ring layout as the mockup: direct trackers on the inner ring, trackers-of-trackers further out. */
function positions(trackers: Tracker[]) {
  const pos = new Map<string, { x: number; y: number; angle: number }>();
  const roots = trackers.filter((t) => !t.via);
  roots.forEach((t, i) => {
    const angle = -Math.PI / 2 + (i / roots.length) * Math.PI * 2;
    pos.set(t.id, { x: RING1.rx * Math.cos(angle), y: RING1.ry * Math.sin(angle), angle });
  });
  roots.forEach((root) => {
    const kids = trackers.filter((t) => t.via === root.id);
    const p = pos.get(root.id)!;
    kids.forEach((k, j) => {
      const angle = p.angle + (j - (kids.length - 1) / 2) * 0.32;
      pos.set(k.id, { x: RING2.rx * Math.cos(angle), y: RING2.ry * Math.sin(angle), angle });
    });
  });
  return pos;
}

function toElements(scan: SiteScan): ElementDefinition[] {
  const pos = positions(scan.trackers);
  const els: ElementDefinition[] = [
    { group: "nodes", data: { id: SITE_ID, label: scan.domain }, position: { x: 0, y: 0 }, classes: "site" },
  ];
  scan.trackers.forEach((t) => {
    const p = pos.get(t.id)!;
    const unknown = t.category === "unknown";
    els.push({
      group: "nodes",
      data: { id: t.id, label: t.domain, color: CATEGORY_META[t.category].color, size: nodeSize(t.requests) },
      position: { x: p.x, y: p.y },
      classes: unknown ? "crumb unknown" : "crumb",
    });
    els.push({
      group: "edges",
      data: { id: `e-${t.id}`, source: t.via ?? SITE_ID, target: t.id },
      classes: unknown ? "unknown" : "",
    });
  });
  return els;
}

interface CrumbTrailProps {
  scan: SiteScan;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** The tracker graph (Cytoscape.js): the site is the cookie in the middle, every crumb is a domain it phoned home to. */
export default function CrumbTrail({ scan, selectedId, onSelect }: CrumbTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // build the graph whenever the site changes
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: toElements(scan),
      layout: { name: "preset" },
      // pinch-zoom on phones; on desktop the wheel would hijack page scrolling, so use the buttons
      userZoomingEnabled: window.matchMedia("(pointer: coarse)").matches,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
      minZoom: 0.4,
      maxZoom: 2.5,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "font-family": "DM Sans, system-ui, sans-serif",
            "font-size": 13,
            "font-weight": 500,
            color: "#3D2618",
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 6,
            "text-outline-color": "#FFF6E6",
            "text-outline-width": 3,
            "min-zoomed-font-size": 7, // hide labels when too small to read (zoom in to see them)
            "transition-property": "opacity, border-width, border-color",
            "transition-duration": 200,
          },
        },
        {
          selector: "node.crumb",
          style: {
            width: "data(size)",
            height: "data(size)",
            "background-color": "data(color)",
            "border-color": "#1E1209",
            "border-width": 2.5,
          },
        },
        {
          selector: "node.unknown",
          style: {
            "border-style": "dashed",
            "background-image": QUESTION_SVG,
            "background-fit": "contain",
          },
        },
        {
          selector: "node.site",
          style: {
            width: 92,
            height: 92,
            "background-opacity": 0,
            "background-image": COOKIE_SVG,
            "background-fit": "contain",
            "border-width": 0,
            "font-size": 15,
            "font-weight": 700,
            "text-margin-y": 8,
          },
        },
        { selector: "node.hover", style: { "border-width": 4 } },
        { selector: "node.picked", style: { "border-color": "#BC7A2E", "border-width": 6, "font-weight": 700 } },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#BC7A2E",
            "curve-style": "straight",
            "transition-property": "opacity",
            "transition-duration": 200,
          },
        },
        { selector: "edge.unknown", style: { "line-style": "dashed", "line-dash-pattern": [6, 6] } },
        { selector: ".faded", style: { opacity: 0.25 } },
      ],
    });
    cyRef.current = cy;

    // fit to where the crumbs END UP (they start at the cookie while animating in)
    const target = cy.elements().boundingBox();
    const fitToTarget = () => {
      const pad = 28;
      const z = Math.max(
        cy.minZoom(),
        Math.min(cy.maxZoom(), (cy.width() - pad * 2) / target.w, (cy.height() - pad * 2) / target.h),
      );
      cy.zoom(z);
      cy.pan({ x: cy.width() / 2 - z * (target.x1 + target.w / 2), y: cy.height() / 2 - z * (target.y1 + target.h / 2) });
    };
    fitToTarget();

    // clicks
    cy.on("tap", "node.crumb", (e) => {
      const id = e.target.id();
      onSelectRef.current(cy.$id(id).hasClass("picked") ? null : id);
    });
    cy.on("tap", (e) => {
      if (e.target === cy || e.target.id?.() === SITE_ID) onSelectRef.current(null);
    });
    cy.on("mouseover", "node.crumb", (e) => {
      e.target.addClass("hover");
      containerRef.current!.style.cursor = "pointer";
    });
    cy.on("mouseout", "node.crumb", (e) => {
      e.target.removeClass("hover");
      containerRef.current!.style.cursor = "";
    });

    // crumbs fly out from the cookie (skipped for reduced motion)
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cy.edges().style("opacity", 0);
      cy.nodes(".crumb").forEach((n, i) => {
        const target = { ...n.position() };
        n.position({ x: 0, y: 0 }).style("opacity", 0);
        n.delay(i * 45).animate(
          { position: target, style: { opacity: 1 } },
          { duration: 550, easing: "ease-out-cubic", complete: () => n.removeStyle("opacity") },
        );
      });
      cy.edges().delay(250).animate({ style: { opacity: 1 } }, { duration: 600, complete: () => cy.edges().removeStyle("opacity") });
    }

    // keep it fitted when the card resizes
    const ro = new ResizeObserver(() => {
      cy.resize();
      fitToTarget();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [scan]);

  // highlight the picked crumb, its parent and its children; fade the rest
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass("faded picked");
    if (!selectedId) return;
    const node = cy.$id(selectedId);
    if (node.empty()) return;
    node.addClass("picked");
    const keep = node.closedNeighborhood().union(cy.$id(SITE_ID));
    cy.elements().not(keep).addClass("faded");
  }, [selectedId, scan]);

  const zoom = (factor: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  };

  const btn =
    "grid h-8 w-8 place-items-center rounded-lg border-2 border-line bg-white text-sm font-bold text-chip transition hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dough";

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[340px] w-full sm:h-[500px]"
        role="img"
        aria-label={`Tracker graph for ${scan.domain}: ${scan.trackers.length} trackers. Use the list below the graph to inspect each one.`}
      />

      <div className="absolute right-0 top-0 flex gap-1.5">
        <button type="button" className={btn} onClick={() => zoom(1.25)} aria-label="Zoom in">
          +
        </button>
        <button type="button" className={btn} onClick={() => zoom(0.8)} aria-label="Zoom out">
          −
        </button>
        <button type="button" className={btn} onClick={() => cyRef.current?.fit(undefined, 28)} aria-label="Fit graph">
          ⤢
        </button>
      </div>

      {/* keyboard + screen reader access to every crumb (the canvas itself isn't focusable) */}
      <ul className="sr-only">
        {scan.trackers.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => onSelect(t.id === selectedId ? null : t.id)}>
              X-ray {t.domain}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small key under the graph */
export function TrailLegend() {
  const items = ["advertising", "analytics", "social", "fingerprinting"] as const;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-cocoa">
      {items.map((c) => (
        <span key={c} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-[#1E1209]" style={{ backgroundColor: CATEGORY_META[c].color }} />
          {CATEGORY_META[c].label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full border-2 border-dashed border-[#1E1209] bg-[#C9B697]" />
        Not on tracker list (AI guess)
      </span>
      <span>Bigger crumb = more requests · Drag to move · Pinch or use + to zoom</span>
    </div>
  );
}
