import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import type { SiteScan } from "./data/mockScans";
import { getHandoffToken, receiveScan } from "./lib/receiveScan";
import { toSiteScan } from "./lib/scanAdapter";

function App() {
  // Frontend only for now: any email + password "logs in"
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [scans, setScans] = useState<SiteScan[]>([]);
  const [loadingScan, setLoadingScan] = useState(
    getHandoffToken() !== null,
  );
  const [handoffError, setHandoffError] = useState<string | null>(
    null,
  );

  // Page background = the logo's background, read from the logo exactly as the browser draws it
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const [r, g, b, a] = ctx.getImageData(2, 2, 1, 1).data;
      if (a < 250) return; // transparent logo: keep the index.css color
      const color = `rgb(${r} ${g} ${b})`;
      document.documentElement.style.setProperty("--color-crumbs-bg", color);
      document.documentElement.style.setProperty("--crumbs-bg", color);
    };
    img.src = "/logo.png";
  }, []);

  useEffect(() => {
    const token = getHandoffToken();

    if (!token) return;

    let cancelled = false;

    void receiveScan(token)
      .then((shared) => {
        if (cancelled) return;

        const nextScan = toSiteScan(shared);

        setScans((previous) => [
          nextScan,
          ...previous.filter(
            (scan) => scan.domain !== nextScan.domain,
          ),
        ]);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setHandoffError(
          error instanceof Error
            ? error.message
            : "Unable to import the scan.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingScan(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadingScan) {
    return (
      <main className="flex min-h-screen items-center
                       justify-center bg-parchment p-6">
        <p className="text-lg text-chip">
          Opening your cookie jar...
        </p>
      </main>
    );
  }

  if (scans.length > 0 || userEmail) {
    return (
      <Dashboard
        userEmail={userEmail ?? "Local scan preview"}
        onLogout={() => {
          setUserEmail(null);
          setScans([]);
        }}
        scans={scans}
      />
    );
  }

  return (
    <>
      {handoffError && (
        <div
          role="alert"
          className="bg-cream p-4 text-center text-ad"
        >
          {handoffError}
        </div>
      )}

      <LoginPage
        onLogin={({ email }) => setUserEmail(email)}
        onSignUp={() => console.log("go to sign up")}
      />
    </>
  );
}

export default App;
