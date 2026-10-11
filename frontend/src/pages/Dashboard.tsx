import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar, { type User, type View } from "../components/Sidebar";
import SitePicker from "../components/SitePicker";
import { MOCK_SCANS } from "../data/mockScans";
import CookieClassView from "../views/CookieClassView";
import JarView from "../views/JarView";
import SettingsView from "../views/SettingsView";
import TasteTestView from "../views/TasteTestView";
import TrailView from "../views/TrailView";

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  onUpdateUser: (u: User) => void;
  onDeleteAccount: () => void;
}

const VIEWS: View[] = ["jar", "trail", "taste", "class", "settings"];

export default function Dashboard({ user, onLogout, onLogin, onSignUp, onUpdateUser, onDeleteAccount }: DashboardProps) {
  const scans = MOCK_SCANS; // TODO: replace with data from the backend
  const [params] = useSearchParams();

  // The extension opens /dashboard?site=<domain>; start on that site if we have it
  const siteParam = params.get("site");
  const viewParam = params.get("view") as View | null;
  const [view, setView] = useState<View>(viewParam && VIEWS.includes(viewParam) ? viewParam : "jar");
  const [domain, setDomain] = useState(scans.find((s) => s.domain === siteParam)?.domain ?? scans[0].domain);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scan = scans.find((s) => s.domain === domain) ?? scans[0];

  const changeSite = (d: string) => {
    setDomain(d);
    setSelectedId(null);
  };

  const showSitePicker = view === "jar" || view === "trail";

  return (
    <div className="min-h-screen bg-parchment font-sans text-chip">
      <Sidebar view={view} onChange={setView} user={user} onLogout={onLogout} onLogin={onLogin} />

      <main className="overflow-x-clip px-4 py-6 sm:px-8 lg:ml-64 lg:px-10 lg:py-8">
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
          {view === "settings" && (
            <SettingsView
              user={user}
              onUpdateUser={onUpdateUser}
              onLogout={onLogout}
              onDeleteAccount={onDeleteAccount}
              onLogin={onLogin}
              onSignUp={onSignUp}
            />
          )}
        </div>
      </main>
    </div>
  );
}
