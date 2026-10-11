import { useState } from "react";
import Sidebar, { type View } from "../components/Sidebar";
import SitePicker from "../components/SitePicker";
import type { SiteScan } from "../data/mockScans";
import CookieClassView from "../views/CookieClassView";
import JarView from "../views/JarView";
import TasteTestView from "../views/TasteTestView";
import TrailView from "../views/TrailView";

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
  scans: SiteScan[];
}

export default function Dashboard({ userEmail, onLogout, scans }: DashboardProps) {
  const [view, setView] = useState<View>("jar");
  const [domain, setDomain] = useState(scans[0].domain);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scan = scans.find((s) => s.domain === domain) ?? scans[0];

  const changeSite = (d: string) => {
    setDomain(d);
    setSelectedId(null);
  };

  const showSitePicker = view === "jar" || view === "trail";

  // return (
  //   <div className="min-h-screen bg-parchment font-sans text-chip">
  //     <Sidebar view={view} onChange={setView} userEmail={userEmail} onLogout={onLogout} />

  //     <main className="px-4 py-6 sm:px-8 lg:ml-64 lg:px-10 lg:py-8">
  //       <div className="mx-auto max-w-6xl">
  //         {showSitePicker && (
  //           <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
  //             <SitePicker scans={scans} value={domain} onChange={changeSite} />
  //             <p className="text-sm text-cocoa">Scanned {scan.scannedAt}</p>
  //           </div>
  //         )}

  //         {view === "jar" && <JarView scan={scan} selectedId={selectedId} onSelect={setSelectedId} />}
  //         {view === "trail" && <TrailView scan={scan} selectedId={selectedId} onSelect={setSelectedId} />}
  //         {view === "taste" && <TasteTestView scans={scans} />}
  //         {view === "class" && <CookieClassView />}
  //       </div>
  //     </main>
  //   </div>
  // );
  return (
    <div className="min-h-screen bg-parchment font-sans text-chip">
      <Sidebar
        view={view}
        onChange={setView}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      <main className="px-4 py-6 sm:px-8
                       lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          {scans.length === 0 ? (
            <section className="rounded-2xl border-2
                                border-crust bg-cream p-8">
              <h1 className="font-serif text-3xl font-bold">
                Your cookie jar is empty
              </h1>
              <p className="mt-3 text-cocoa">
                Visit a website, open the Cookie Crumbs
                extension, and select "Open the full jar"
                to view a real scan.
              </p>
            </section>
          ) : (
            <>
              {showSitePicker && (
                <div className="mb-6 flex flex-wrap
                                items-center justify-between gap-3">
                  <SitePicker
                    scans={scans}
                    value={scan.domain}
                    onChange={changeSite}
                  />
                  <p className="text-sm text-cocoa">
                    Scanned {scan.scannedAt}
                  </p>
                </div>
              )}

              {view === "jar" && (
                <JarView
                  scan={scan}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}

              {view === "trail" && (
                <TrailView
                  scan={scan}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}

              {view === "taste" && (
                scans.length < 2 ? (
                  <div className="rounded-2xl border-2
                                  border-crust bg-cream p-6">
                    <h2 className="font-serif text-xl font-bold">
                      Taste test
                    </h2>
                    <p className="mt-2 text-cocoa">
                      Scan at least two websites to compare them.
                      Saved scan history will be supported
                      when that feature is connected.
                    </p>
                  </div>
                ) : (
                  <TasteTestView scans={scans} />
                )
              )}

              {view === "class" && <CookieClassView />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
