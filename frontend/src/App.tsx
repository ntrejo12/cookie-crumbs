import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";

function App() {
  // Frontend only for now: any email + password "logs in"
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  if (!userEmail) {
    return <LoginPage onLogin={({ email }) => setUserEmail(email)} onSignUp={() => console.log("go to sign up")} />;
  }

  return <Dashboard userEmail={userEmail} onLogout={() => setUserEmail(null)} />;
}

export default App;
