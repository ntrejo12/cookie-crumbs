import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import type { User } from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import type { SiteScan } from "./data/mockScans";
import { getHandoffToken, receiveScan } from "./lib/receiveScan";
import { toSiteScan } from "./lib/scanAdapter";

/**
 * Frontend-only accounts for now: the signed-in user is remembered in this browser
 * ("Keep me logged in" = localStorage, otherwise only for this tab). Swap these for neon.auth later.
 */
const USER_KEY = "cc-user";

/**
 * Account used when the dashboard is opened from the extension.
 * Placeholder until the extension has a real login: change these to your own name/email for demos.
 */
const EXTENSION_USER: User = { name: "Cookie Crumbs User", email: "you@cookiecrumbs.app" };

/** Scans received from the extension, kept on this device so you can compare sites across visits. */
const SCANS_KEY = "cc-scans";
const MAX_SAVED_SCANS = 10;

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function saveUser(user: User | null, remember = true) {
  try {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    if (user) (remember ? localStorage : sessionStorage).setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage blocked: you'll just be logged out on refresh */
  }
}

function loadScans(): SiteScan[] {
  try {
    const raw = localStorage.getItem(SCANS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SiteScan[]) : [];
  } catch {
    return [];
  }
}

function saveScans(scans: SiteScan[]) {
  try {
    if (scans.length) localStorage.setItem(SCANS_KEY, JSON.stringify(scans.slice(0, MAX_SAVED_SCANS)));
    else localStorage.removeItem(SCANS_KEY);
  } catch {
    /* storage blocked: scans just won't survive a refresh */
  }
}

const nameFromEmail = (email: string) => {
  const n = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "Cookie fan";
};

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(loadUser);
  const [scans, setScans] = useState<SiteScan[]>(loadScans);
  // Opened from the extension's "Open The Cookie Jar" button (URL has #scan=<token>)
  const [loadingScan, setLoadingScan] = useState(getHandoffToken() !== null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  useEffect(() => saveScans(scans), [scans]);

  const signIn = (u: User, remember: boolean) => {
    saveUser(u, remember);
    setUser(u);
    navigate("/dashboard");
  };

  const logOut = () => {
    saveUser(null);
    setUser(null);
    navigate("/");
  };

  const updateUser = (u: User) => {
    const remembered = (() => {
      try {
        return localStorage.getItem(USER_KEY) !== null;
      } catch {
        return true;
      }
    })();
    saveUser(u, remembered);
    setUser(u);
  };

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

  // Receive a real scan handed over by the extension
  useEffect(() => {
    const token = getHandoffToken();
    if (!token) return;

    let cancelled = false;

    void receiveScan(token)
      .then((shared) => {
        if (cancelled) return;
        const nextScan = toSiteScan(shared);
        setScans((previous) => [nextScan, ...previous.filter((scan) => scan.domain !== nextScan.domain)]);

        // You're already in the extension, so you're signed in here too
        if (!loadUser()) {
          saveUser(EXTENSION_USER, true);
          setUser(EXTENSION_USER);
        }
        navigate(`/dashboard?site=${encodeURIComponent(nextScan.domain)}`, { replace: true });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setHandoffError(error instanceof Error ? error.message : "Unable to import the scan.");
      })
      .finally(() => {
        if (!cancelled) setLoadingScan(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loadingScan) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-crumbs-bg p-6 font-sans">
        <img src="/logo.png" alt="" className="h-24 w-auto motion-safe:animate-pulse" />
        <p className="font-serif text-2xl font-bold text-cream">Opening your cookie jar...</p>
      </main>
    );
  }

  const errorBanner = handoffError && (
    <div role="alert" className="relative z-30 bg-[#F8E1DC] px-4 py-3 text-center text-sm font-semibold text-ad">
      {handoffError}
      <button type="button" onClick={() => setHandoffError(null)} className="ml-3 underline">
        Dismiss
      </button>
    </div>
  );

  return (
    <>
      {errorBanner}
      <Routes>
        <Route
          path="/"
          element={
            <LoginPage
              mode="login"
              onLogin={({ email, remember }) => signIn({ name: nameFromEmail(email), email }, remember)}
              onSwitchMode={() => navigate("/signup")}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <LoginPage
              mode="signup"
              onSignUp={({ name, email, remember }) => signIn({ name, email }, remember)}
              onSwitchMode={() => navigate("/")}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <Dashboard
              user={user}
              scans={scans}
              onLogout={logOut}
              onLogin={() => navigate("/")}
              onSignUp={() => navigate("/signup")}
              onUpdateUser={updateUser}
              onDeleteAccount={logOut}
              onClearHistory={() => setScans([])}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
