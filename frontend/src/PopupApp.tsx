import { useEffect, useState } from "react";
import {
  analyzeScan,
  type ScanResponse,
  type ScanRequest,
} from "./lib/scanApi";
import {
  HANDOFF_STORAGE_PREFIX,
  WEBSITE_ORIGIN,
} from "./lib/handoff";

interface Stats {
  website: string;
  trackers: number;
  requests: number;
  cookies: number;
  domains: number;
}

interface TabScan {
  website: string;
  requests: Record<string, number>;
}

/** What the bandit says, based on known trackers. Tweak the thresholds here. */
function verdict(trackers: number) {
  if (trackers === 0) return "Spotless! Not a crumb in sight.";
  if (trackers <= 3) return "Not too crumby!";
  if (trackers <= 9) return "Getting a little crumby...";
  if (trackers <= 19) return "Pretty crumby. Trackers are watching.";
  return "Crumbs everywhere! Time to clean up.";
}

function toStats(scan: ScanResponse): Stats {
  return {
    website: scan.website,
    trackers: scan.tracker_count,
    requests: scan.third_party_requests,
    cookies: scan.cookie_count,
    domains: scan.trackers.length,
  };
}

export default function PopupApp() {
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
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

  // Hand the scan to the website and open the dashboard on it
  async function openFullJar() {
    if (!scan || opening) return;

    try {
      setOpening(true);
      setError(null);

      // Cryptographically random, single-use handoff token.
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      const token = Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      const key = `${HANDOFF_STORAGE_PREFIX}${token}`;

      await chrome.storage.session.set({
        [key]: {
          token,
          createdAt: Date.now(),
          scan: {
            version: 1,
            analyzedAt: new Date().toISOString(),
            result: scan,
          },
        },
      });

      // Only the random identifier goes into the URL.
      // The scan itself never goes into the URL.
      await chrome.tabs.create({
        url: `${WEBSITE_ORIGIN}/#scan=${token}`,
      });

      window.close();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open the full dashboard.",
      );
    } finally {
      setOpening(false);
    }
  }

  const stats = scan ? toStats(scan) : null;

  // what the bandit says
  const said = loading
    ? "Sniffing out crumbs..."
    : error
      ? error
      : stats
        ? verdict(stats.trackers)
        : "Nothing to see yet.";

  const show = (n: number | undefined) => (loading || n === undefined ? "–" : n);

  const cookies = [
    { img: "/popup/cookie-pink.png", label: "Known Trackers", value: show(stats?.trackers) },
    { img: "/popup/cookie-green.png", label: "3rd Party Requests", value: show(stats?.requests) },
    { img: "/popup/cookie-white.png", label: "Page Accessible", value: show(stats?.cookies) },
    { img: "/popup/cookie-blue.png", label: "3rd Party Domains", value: show(stats?.domains) },
  ];

  return (
    <div className="w-[380px] bg-[#FCEECA] px-5 pb-4 pt-4 font-sans text-chip">
      {/* Title */}
      <header className="text-center">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Cookie Crumbs</h1>
        <p className="mt-0.5 truncate text-xs text-cocoa">
          {stats ? (
            <>
              Scanning <span className="font-semibold text-chip">{stats.website}</span>
            </>
          ) : (
            "See who's following your crumbs."
          )}
        </p>
      </header>

      {/* Bandit + speech bubble: positioned exactly as in the Canva mockup,
          measured against the cookie grid below (left cookie starts at 35px, right cookie ends at 305px) */}
      <section className="relative mt-2 h-[161px]">
        <img
          src="/popup/bandit.png"
          alt=""
          className="absolute left-[22px] top-[29px] w-[168px] select-none"
          draggable={false}
        />
        <div className="absolute left-[195px] top-0 w-[138px]">
          <img src="/popup/bubble.png" alt="" className="w-full select-none" draggable={false} />
          <p
            aria-live="polite"
            className={`absolute bottom-[30%] left-[14%] right-[7%] top-[8%] flex items-center justify-center text-center font-hand text-[14px] font-bold leading-tight text-black ${
              loading ? "motion-safe:animate-pulse" : ""
            }`}
          >
            {said}
          </p>
        </div>
      </section>

      {/* The four cookies */}
      <section className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5" aria-label="Scan results">
        {cookies.map((c, i) => (
          <div key={c.label} className="flex flex-col items-center">
            <div
              className="relative h-[92px] w-[92px] motion-safe:animate-pop"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img src={c.img} alt="" className="h-full w-full select-none object-contain" draggable={false} />
              <span
                className="absolute inset-0 flex items-center justify-center font-serif text-[30px] font-bold tabular-nums text-chip"
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
        onClick={() => void openFullJar()}
        disabled={!scan || loading || opening}
        className="group mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FEF7E5] px-4 py-2 transition hover:brightness-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-dough/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 disabled:active:scale-100"
      >
        <span className="text-center leading-tight">
          <span className="block text-sm font-semibold text-cocoa">for more info</span>
          <span className="block font-serif text-xl font-bold text-chip">
            {opening ? "Opening..." : "Open The Cookie Jar"}
          </span>
        </span>
        <img
          src="/popup/jar.png"
          alt=""
          className="h-[64px] w-auto transition-transform duration-300 group-enabled:group-hover:-rotate-6 group-enabled:group-hover:scale-105"
          draggable={false}
        />
      </button>
    </div>
  );
}
