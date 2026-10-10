import { useEffect, useState } from "react";
import {
  analyzeScan,
  type ScanResponse,
  type ScanRequest,
} from "./lib/scanApi";

const WEBSITE_URL = "http://localhost:5173/";

interface TabScan {
  website: string;
  requests: Record<string, number>;
}

/**
 * What the bandit says in the speech bubble.
 * Based on known trackers; tweak the thresholds here.
 */
function verdict(scan: ScanResponse) {
  const n = scan.tracker_count;
  if (n === 0) return { text: "Spotless! Not a crumb in sight.", tone: "text-[#3E7A3A]" };
  if (n <= 3) return { text: "Not too crumby!", tone: "text-[#3E7A3A]" };
  if (n <= 9) return { text: "Getting a little crumby...", tone: "text-crust" };
  if (n <= 19) return { text: "Pretty crumby. Trackers are watching.", tone: "text-ad" };
  return { text: "Crumbs everywhere! Time to clean up.", tone: "text-ad" };
}

export default function PopupApp() {
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScan() {
      try {
        setLoading(true);
        setError(null);

        // Find the currently active tab.
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab.id || !tab.url) {
          throw new Error("No active website found.");
        }

        if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
          throw new Error("Open a regular website to scan it.");
        }

        // Get collected requests from the background worker.
        const tabScan = (await chrome.runtime.sendMessage({
          type: "GET_TAB_SCAN",
          tabId: tab.id,
        })) as TabScan;

        // Count cookies accessible to this page.
        // This is NOT a count of all third-party cookies.
        const cookies = await chrome.cookies.getAll({ url: tab.url });

        const website = new URL(tab.url).hostname;

        const requests = Object.entries(
          tabScan?.website === website ? tabScan.requests : {}
        ).map(([domain, count]) => ({
          domain,
          request_count: count,
        }));

        const payload: ScanRequest = {
          website,
          requests,
          cookies: {
            total: cookies.length,
            third_party: 0,
          },
          permission_count: 0,
        };

        const result = await analyzeScan(payload);
        setScan(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to analyze this website.");
      } finally {
        setLoading(false);
      }
    }

    void loadScan();
  }, []);

  function openFullJar() {
    chrome.tabs.create({ url: WEBSITE_URL });
  }

  // what the bandit says
  const said =
    loading ? { text: "Sniffing out crumbs...", tone: "text-cocoa" }
    : error ? { text: error, tone: "text-ad" }
    : scan ? verdict(scan)
    : { text: "Nothing to see yet.", tone: "text-cocoa" };

  const show = (n: number | undefined) => (loading || n === undefined ? "–" : n);

  const cookies = [
    { img: "/popup/cookie-pink.png", label: "Known Trackers", value: show(scan?.tracker_count) },
    { img: "/popup/cookie-green.png", label: "3rd Party Requests", value: show(scan?.third_party_requests) },
    { img: "/popup/cookie-white.png", label: "Page Accessible", value: show(scan?.cookie_count) },
    { img: "/popup/cookie-blue.png", label: "3rd Party Domains", value: show(scan?.trackers.length) },
  ];

  return (
    <div className="w-[380px] bg-[#FCEECA] px-5 pb-3 pt-4 font-sans text-chip">
      {/* Title */}
      <header className="text-center">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Cookie Crumbs</h1>
        <p className="mt-0.5 truncate text-xs text-cocoa">
          {scan ? <>Scanning <span className="font-semibold text-chip">{scan.website}</span></> : "See who's following your crumbs."}
        </p>
      </header>

      {/* Bandit + speech bubble */}
      <section className="mt-2 flex items-center justify-center gap-1">
        <img src="/popup/bandit.png" alt="" className="w-[116px] shrink-0 select-none" draggable={false} />
        <div className="relative w-[190px] shrink-0">
          <img src="/popup/bubble.png" alt="" className="w-full select-none" draggable={false} />
          <p
            aria-live="polite"
            className={`absolute left-[15%] right-[7%] top-[8%] bottom-[30%] flex items-center justify-center text-center font-hand text-[19px] font-bold leading-tight ${said.tone} ${loading ? "motion-safe:animate-pulse" : ""}`}
          >
            {said.text}
          </p>
        </div>
      </section>

      {/* The four cookies */}
      <section className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5" aria-label="Scan results">
        {cookies.map((c, i) => (
          <div key={c.label} className="flex flex-col items-center">
            <div className="relative h-[98px] w-[98px] motion-safe:animate-pop" style={{ animationDelay: `${i * 80}ms` }}>
              <img src={c.img} alt="" className="h-full w-full object-contain select-none" draggable={false} />
              <span
                className="absolute inset-0 flex items-center justify-center font-serif text-[32px] font-bold tabular-nums text-chip"
                style={{ textShadow: "0 0 3px #fff, 0 0 6px #fff, 0 0 10px #fff" }}
              >
                {c.value}
              </span>
            </div>
            <p className="mt-1 font-hand text-[17px] leading-none">{c.label}</p>
          </div>
        ))}
      </section>

      {/* Open the cookie jar */}
      <button
        type="button"
        onClick={openFullJar}
        className="group mt-2 flex w-full items-center justify-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-dough/50"
      >
        <span className="text-right leading-tight">
          <span className="block text-sm font-semibold text-cocoa">for more info</span>
          <span className="block font-serif text-xl font-bold text-chip group-hover:underline">Open The Cookie Jar</span>
        </span>
        <img
          src="/popup/jar.png"
          alt=""
          className="h-[70px] w-auto transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
          draggable={false}
        />
      </button>
    </div>
  );
}
