import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import CrumbDivider from "../components/CrumbDivider";
import Sidebar, { type User, type View } from "../components/Sidebar";
import SitePicker from "../components/SitePicker";
import type { SiteScan } from "../data/mockScans";
import CookieClassView from "../views/CookieClassView";
import JarView from "../views/JarView";
import SettingsView from "../views/SettingsView";
import TasteTestView from "../views/TasteTestView";
import TrailView from "../views/TrailView";

interface DashboardProps {
  user: User | null;
  scans: SiteScan[];
  onLogout: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  onUpdateUser: (u: User) => void;
  onDeleteAccount: () => void;
  onClearHistory: () => void;
}

const VIEWS: View[] = ["jar", "trail", "taste", "class", "settings"];

function EmptyJar({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col items-center py-16 text-center">
      <img src="/popup/jar.png" alt="" className="h-36 w-auto opacity-90" />
      <h1 className="mt-6 font-serif text-4xl font-bold">{title}</h1>
      <p className="mt-3 max-w-md text-cocoa">{children}</p>
    </section>
  );
}

export default function Dashboard({
  user,
  scans,
  onLogout,
  onLogin,
  onSignUp,
  onUpdateUser,
  onDeleteAccount,
  onClearHistory,
}: DashboardProps) {
  const [params] = useSearchParams();

  // The extension opens /dashboard?site=<domain>; start on that site
  const siteParam = params.get("site");
  const viewParam = params.get("view") as View | null;
  const [view, setView] = useState<View>(viewParam && VIEWS.includes(viewParam) ? viewParam : "jar");
  const [domain, setDomain] = useState<string | null>(siteParam);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (siteParam) setDomain(siteParam);
  }, [siteParam]);

  const scan = scans.find((s) => s.domain === domain) ?? scans[0];

  const changeSite = (d: string) => {
    setDomain(d);
    setSelectedId(null);
  };

  const needsScan = view === "jar" || view === "trail";
  const showSitePicker = needsScan && scan;

  return (
    <div className="min-h-screen bg-parchment font-sans text-chip">
      <Sidebar view={view} onChange={setView} user={user} onLogout={onLogout} onLogin={onLogin} />

      <main className="overflow-x-clip px-4 py-6 sm:px-8 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          {showSitePicker && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <SitePicker scans={scans} value={scan.domain} onChange={changeSite} />
              <p className="text-sm text-cocoa">Scanned {scan.scannedAt}</p>
            </div>
          )}

          {needsScan && !scan && (
            <EmptyJar title="Your Cookie Jar Is Empty">
              Visit a website, open the Cookie Crumbs extension, and press "Open The Cookie Jar" to see what it
              left behind.
            </EmptyJar>
          )}

          {view === "jar" && scan && <JarView scan={scan} selectedId={selectedId} onSelect={setSelectedId} />}
          {view === "trail" && scan && <TrailView scan={scan} selectedId={selectedId} onSelect={setSelectedId} />}

          {view === "taste" &&
            (scans.length < 2 ? (
              <>
                <header className="text-center">
                  <h1 className="font-serif text-3xl font-bold text-chip sm:text-4xl">
                    Crumb Test: Which Site Is Crumbier?
                  </h1>
                  <p className="mt-1 text-cocoa">Pick two sites you've scanned and compare what they leave behind.</p>
                  <CrumbDivider className="mt-6" />
                </header>
                <EmptyJar title="Not Enough Crumbs Yet">
                  Scan at least two websites with the extension to compare them.{" "}
                  {scans.length === 1 && `You've scanned ${scans[0].domain} so far.`}
                </EmptyJar>
              </>
            ) : (
              <TasteTestView scans={scans} />
            ))}

          {view === "class" && <CookieClassView />}
          {view === "settings" && (
            <SettingsView
              user={user}
              onUpdateUser={onUpdateUser}
              onLogout={onLogout}
              onDeleteAccount={onDeleteAccount}
              onLogin={onLogin}
              onSignUp={onSignUp}
              onClearHistory={onClearHistory}
            />
          )}
        </div>
      </main>
    </div>
  );
}
