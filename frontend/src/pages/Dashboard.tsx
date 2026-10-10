import { useState } from "react";
import Sidebar, { type View } from "../components/Sidebar";
import SitePicker from "../components/SitePicker";
import { MOCK_SCANS } from "../data/mockScans";
import CookieClassView from "../views/CookieClassView";
import JarView from "../views/JarView";
import TasteTestView from "../views/TasteTestView";
import TrailView from "../views/TrailView";

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export default function Dashboard({ userEmail, onLogout }: DashboardProps) {
  const scans = MOCK_SCANS; // TODO: replace with data from the backend
  const [view, setView] = useState<View>("jar");
  const [domain, setDomain] = useState(scans[0].domain);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scan = scans.find((s) => s.domain === domain) ?? scans[0];

  const changeSite = (d: string) => {
    setDomain(d);
    setSelectedId(null);
  };

  const showSitePicker = view === "jar" || view === "trail";

  return (
    <div className="min-h-screen bg-parchment font-sans text-chip">
      <Sidebar view={view} onChange={setView} userEmail={userEmail} onLogout={onLogout} />

      <main className="px-4 py-6 sm:px-8 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          {showSitePicker && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <SitePicker scans={scans} value={domain} onChange={changeSite} />
              <p className="text-sm text-cocoa">Scanned {scan.scannedAt}</p>
            </div>
          )}

          {view === "jar" && <JarView scan={scan} selectedId={selectedId} onSelect={setSelectedId} />}
          {view === "trail" && <TrailView scan={scan} selectedId={selectedId} onSelect={setSelectedId} />}
          {view === "taste" && <TasteTestView scans={scans} />}
          {view === "class" && <CookieClassView />}
        </div>
      </main>
    </div>
  );
}
