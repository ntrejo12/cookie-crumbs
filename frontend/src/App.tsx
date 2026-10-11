import { startTransition, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import type { User } from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import type { SiteScan } from "./data/mockScans";
import { neon } from "./lib/neon";
import { getHandoffToken, receiveScan } from "./lib/receiveScan";
import { toSiteScan } from "./lib/scanAdapter";

/** Scans received from the extension, kept on this device so you can compare sites across visits. */
const SCANS_KEY_PREFIX = "cc-scans:";
const MAX_SAVED_SCANS = 10;
const PENDING_SCAN_KEY = "cc-pending-scan-token";

function loadPendingScanToken(): string | null {
  try {
    const token = getHandoffToken() ?? sessionStorage.getItem(PENDING_SCAN_KEY);
    if (token) sessionStorage.setItem(PENDING_SCAN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

function clearPendingScanToken() {
  try {
    sessionStorage.removeItem(PENDING_SCAN_KEY);
  } catch {
    /* storage blocked: the URL token remains available for this navigation */
  }
}

function loadScans(userId: string): SiteScan[] {
  try {
    const raw = localStorage.getItem(`${SCANS_KEY_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SiteScan[]) : [];
  } catch {
    return [];
  }
}

function saveScans(userId: string, scans: SiteScan[]) {
  try {
    const key = `${SCANS_KEY_PREFIX}${userId}`;
    if (scans.length) localStorage.setItem(key, JSON.stringify(scans.slice(0, MAX_SAVED_SCANS)));
    else localStorage.removeItem(key);
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
  const location = useLocation();
  const session = neon.auth.useSession();
  const authUser = session.data?.user ?? null;
  const user: User | null = authUser
    ? { name: authUser.name || nameFromEmail(authUser.email), email: authUser.email }
    : null;
  const [pendingScanToken, setPendingScanToken] = useState(loadPendingScanToken);
  const [scans, setScans] = useState<SiteScan[]>([]);
  const [scansUserId, setScansUserId] = useState<string | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  useEffect(() => {
    if (session.isPending) return;
    startTransition(() => {
      if (!authUser) {
        setScans([]);
        setScansUserId(null);
        return;
      }
      setScans(loadScans(authUser.id));
      setScansUserId(authUser.id);
    });
  }, [authUser, session.isPending]);

  useEffect(() => {
    if (authUser && scansUserId === authUser.id) saveScans(authUser.id, scans);
  }, [authUser, scans, scansUserId]);

  const signIn = async ({ email, password, remember }: { email: string; password: string; remember: boolean }) => {
    const result = await neon.auth.signIn.email({ email, password, rememberMe: remember });
    if (result.error) throw new Error(result.error.message);
    const currentSession = await neon.auth.getSession();
    if (!currentSession.data?.user) throw new Error("Your session could not be started. Please try again.");
    navigate("/dashboard");
  };

  const signUp = async ({ name, email, password }: { name: string; email: string; password: string; remember: boolean }) => {
    const result = await neon.auth.signUp.email({ name, email, password });
    if (result.error) throw new Error(result.error.message);
    const currentSession = await neon.auth.getSession();
    if (!currentSession.data?.user) {
      throw new Error("Your account was created. Check your email to verify it, then log in.");
    }
    navigate("/dashboard");
  };

  const logOut = async () => {
    const result = await neon.auth.signOut();
    if (result.error) {
      setHandoffError(result.error.message ?? "Unable to log out. Please try again.");
      return;
    }
    navigate("/");
  };

  const updateUser = async (nextUser: User) => {
    const result = await neon.auth.updateUser({ name: nextUser.name });
    if (result.error) setHandoffError(result.error.message ?? "Unable to update your account.");
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
    if (session.isPending || !authUser || !pendingScanToken) return;
    if (location.pathname !== "/dashboard") {
      navigate(`/dashboard#scan=${pendingScanToken}`, { replace: true });
      return;
    }

    let cancelled = false;

    void receiveScan(pendingScanToken)
      .then((shared) => {
        if (cancelled) return;
        const nextScan = toSiteScan(shared);
        clearPendingScanToken();
        setPendingScanToken(null);
        setScans((previous) => [nextScan, ...previous.filter((scan) => scan.domain !== nextScan.domain)]);
        navigate(`/dashboard?site=${encodeURIComponent(nextScan.domain)}`, { replace: true });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        clearPendingScanToken();
        setPendingScanToken(null);
        setHandoffError(
          error instanceof Error && error.message.includes("Could not receive the scan")
            ? "This scan expired while you were signing in. Please scan again."
            : error instanceof Error
              ? error.message
              : "Unable to import the scan. Please scan again.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [authUser, location.pathname, navigate, pendingScanToken, session.isPending]);

  useEffect(() => {
    if (session.isPending || authUser || !pendingScanToken || location.pathname === "/" || location.pathname === "/signup") return;
    navigate("/", { replace: true });
  }, [authUser, location.pathname, navigate, pendingScanToken, session.isPending]);

  const loadingScan = Boolean(authUser && pendingScanToken && location.pathname === "/dashboard");

  if (session.isPending || loadingScan) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-crumbs-bg p-6 font-sans">
        <img src="/logo.png" alt="" className="h-24 w-auto motion-safe:animate-pulse" />
        <p className="font-serif text-2xl font-bold text-cream">{loadingScan ? "Opening your cookie jar..." : "Checking your cookie jar..."}</p>
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
              onLogin={signIn}
              onSwitchMode={() => navigate("/signup")}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <LoginPage
              mode="signup"
              onSignUp={signUp}
              onSwitchMode={() => navigate("/")}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
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
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
