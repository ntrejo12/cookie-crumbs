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


interface TabScan {
  website: string;
  requests: Record<string, number>;
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

        if (
          !tab.url.startsWith("http://") &&
          !tab.url.startsWith("https://")
        ) {
          throw new Error(
            "Open a regular website to scan it."
          );
        }

        // Get collected requests from the background worker.
        const tabScan =
          (await chrome.runtime.sendMessage({
            type: "GET_TAB_SCAN",
            tabId: tab.id,
          })) as TabScan;

        // Count cookies accessible to this page.
        // This is NOT a count of all third-party cookies.
        const cookies = await chrome.cookies.getAll({
          url: tab.url,
        });

        const website = new URL(tab.url).hostname;

        const requests = Object.entries(
          tabScan?.website === website
            ? tabScan.requests
            : {}
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
        setError(
          err instanceof Error
            ? err.message
            : "Unable to analyze this website."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadScan();
  }, []);

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

  return (
    <div className="w-[360px] bg-cream p-5 text-chip">
      <div className="mb-5 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Cookie Crumbs logo"
          className="h-12 w-12 object-contain"
        />

        <div>
          <h1 className="font-serif text-xl font-bold">
            Cookie Crumbs
          </h1>
          <p className="text-xs text-cocoa">
            See who's following your crumbs.
          </p>
        </div>
      </div>

      {loading && (
        <p className="py-6 text-center text-sm">
          Following the crumbs...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-300
                     p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {scan && !loading && (
        <div className="mb-5 space-y-4">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-sm text-cocoa">
              Scanning
            </p>

            <h2 className="break-all font-bold">
              {scan.website}
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold">
                  {scan.tracker_count}
                </p>
                <p className="text-xs text-cocoa">
                  Known trackers
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold">
                  {scan.third_party_requests}
                </p>
                <p className="text-xs text-cocoa">
                  Third-party requests
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold">
                  {scan.cookie_count}
                </p>
                <p className="text-xs text-cocoa">
                  Page-accessible cookies
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold">
                  {scan.trackers.length}
                </p>
                <p className="text-xs text-cocoa">
                  Third-party domains
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line p-4">
            <h3 className="mb-3 font-bold">
              Tracker breakdown
            </h3>

            {Object.entries(scan.category_counts).length === 0 ? (
              <p className="text-sm text-cocoa">
                No known trackers identified in the
                observed requests.
              </p>
            ) : (
              Object.entries(scan.category_counts).map(
                ([category, count]) => (
                  <div
                    key={category}
                    className="flex justify-between py-1 text-sm"
                  >
                    <span className="capitalize">
                      {category}
                    </span>
                    <span className="font-bold">
                      {count}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => void openFullJar()}
        disabled={!scan || loading || opening}
        className="w-full rounded-full bg-chip px-5 py-3
                   font-bold text-cream hover:opacity-90
                   disabled:cursor-not-allowed
                   disabled:opacity-50"
      >
        {opening ? "Opening the full jar..." : "Open the full jar"}
      </button>
    </div>
  );
}
