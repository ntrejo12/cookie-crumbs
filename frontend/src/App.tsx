import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import type { User } from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";

/**
 * Frontend-only accounts for now: the signed-in user is remembered in this browser
 * ("Keep me logged in" = localStorage, otherwise only for this tab). Swap these for neon.auth later.
 */
const USER_KEY = "cc-user";

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

const nameFromEmail = (email: string) => {
  const n = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "Cookie fan";
};

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(loadUser);

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

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage
              mode="login"
              onLogin={({ email, remember }) => signIn({ name: nameFromEmail(email), email }, remember)}
              onSwitchMode={() => navigate("/signup")}
            />
          )
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
      {/* The extension opens /dashboard?site=<domain> directly, logged in or not */}
      <Route
        path="/dashboard"
        element={
          <Dashboard
            user={user}
            onLogout={logOut}
            onLogin={() => navigate("/")}
            onSignUp={() => navigate("/signup")}
            onUpdateUser={updateUser}
            onDeleteAccount={logOut}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
