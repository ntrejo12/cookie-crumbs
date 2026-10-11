import { useState, type FormEvent } from "react";

/**
 * Cookie Crumbs: Login + sign-up page ("Bake an account")
 * Page background = logo background (bg-crumbs-bg in index.css).
 * The page owns validation and presentation; App supplies the Neon Auth actions.
 */

// Deterministic pseudo-random so crumbs don't jump around between renders
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// Irregular rounded shapes, like the chunks flying off the logo
const crumbShapes = [
  "42% 58% 46% 54% / 50% 44% 56% 50%",
  "35%",
  "50%", // round crumb
  "60% 40% 55% 45% / 45% 60% 40% 55%",
  "30% 50% 40% 60%",
];

const CRUMB_COUNT = 42;
const crumbs = Array.from({ length: CRUMB_COUNT }, (_, i) => {
  const r = (n: number) => rand(i * 7 + n);
  const size = Math.round(8 + r(1) ** 2 * 30); // mostly small, a few chunky
  const top = r(2) * 96;
  let left = r(3) * 97;
  // keep the middle clear so crumbs don't sit behind the logo, title or card
  if (left > 20 && left < 78 && top > 8 && top < 90) left = left < 49 ? left * 0.4 : 78 + (left - 49) * 0.6;
  return {
    top: `${top.toFixed(1)}%`,
    left: `${left.toFixed(1)}%`,
    size,
    rotate: Math.round(r(4) * 360),
    radius: crumbShapes[Math.floor(r(5) * crumbShapes.length)],
    border: size > 22 ? 4 : size > 14 ? 3 : 2,
    opacity: 0.35 + r(6) * 0.45,
    delay: `${(r(7) * 6).toFixed(2)}s`,
    duration: `${(5 + r(8) * 4).toFixed(1)}s`,
  };
});

const inputClass =
  "w-full rounded-xl border-2 border-[#E5CFA8] bg-white px-4 py-3 text-[15px] text-chip outline-none transition placeholder:text-[#B39A7E] focus:border-dough focus:ring-4 focus:ring-dough/40";

interface LoginPageProps {
  mode?: "login" | "signup";
  onLogin?: (values: { email: string; password: string; remember: boolean }) => void | Promise<void>;
  onSignUp?: (values: { name: string; email: string; password: string; remember: boolean }) => void | Promise<void>;
  /** switch between "Log in" and "Bake an account" */
  onSwitchMode?: () => void;
}

export default function LoginPage({ mode = "login", onLogin, onSignUp, onSwitchMode }: LoginPageProps) {
  const signup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (signup) {
      if (!name || !email || !password || !confirm) return setError("Fill in every field to bake your account.");
      if (!email.includes("@")) return setError("That email doesn't look quite right.");
      if (password.length < 8) return setError("Use at least 8 characters for your password.");
      if (password !== confirm) return setError("Passwords don't match.");
      setSubmitting(true);
      setError("");
      try {
        await onSignUp?.({ name, email, password, remember });
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to create your account.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!email || !password) return setError("Fill in both fields to open the jar.");
    setSubmitting(true);
    setError("");
    try {
      await onLogin?.({ email, password, remember });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  };

  const passwordField = (label: string, value: string, set: (v: string) => void, auto: string) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-chip">{label}</span>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          autoComplete={auto}
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder="••••••••"
          className={`${inputClass} pr-16`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-semibold text-crust transition hover:bg-[#F6E8D0]"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-crumbs-bg px-4 py-10 font-sans">
      {/* Background crumbs */}
      {crumbs.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute border-black motion-safe:animate-float"
          style={{
            top: c.top,
            left: c.left,
            width: c.size,
            height: c.size,
            borderWidth: c.border,
            borderRadius: c.radius,
            opacity: c.opacity,
            rotate: `${c.rotate}deg`,
            // tan crumb with the darker baked corner from the logo
            background: "linear-gradient(225deg, #EABC86 55%, #D9A877 56%)",
            animationDelay: c.delay,
            animationDuration: c.duration,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-3xl">
        {/* Logo + brand */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="Cookie Crumbs logo: a cookie wearing a bandit mask"
            className="h-32 w-auto select-none"
            draggable={false}
          />
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-cream">Cookie Crumbs</h1>
          <p className="mt-1 text-base text-dough">See who's following your crumbs.</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border-2 border-crust bg-cream p-7 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:px-10 sm:py-8"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="font-serif text-2xl font-bold text-chip">{signup ? "Bake An Account" : "Welcome Back"}</h2>
            <p className="text-sm text-[#6B4A2E]">
              {signup ? "Mix in your details to start your cookie jar." : "Log in to open your cookie jar."}
            </p>
          </div>

          {/* Fields side by side on wider screens */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {signup && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-chip">Name</span>
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-chip">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>
            {passwordField("Password", password, setPassword, signup ? "new-password" : "current-password")}
            {signup && passwordField("Confirm password", confirm, setConfirm, "new-password")}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-chip">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded accent-chip"
              />
              Keep me logged in (we'll leave one good cookie)
            </label>
            {!signup && (
              <a href="#" className="text-sm font-medium text-crust underline-offset-2 hover:underline">
                Forgot password?
              </a>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-[#F8E1DC] px-3 py-2 text-sm font-medium text-ad">
              {error}
            </p>
          )}

          {/* Actions side by side on wider screens */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-chip py-3.5 text-base font-bold text-cream transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-dough/60 active:scale-[0.99]"
            >
              {submitting ? "Opening..." : signup ? "Bake my account" : "Log in"}
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#E5CFA8] bg-white py-3 text-sm font-semibold text-chip transition hover:bg-[#FBF1E0]"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              {signup ? "Sign up with Google" : "Continue with Google"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[#6B4A2E]">
            {signup ? "Already have an account? " : "New here? "}
            <button type="button" onClick={onSwitchMode} className="font-bold text-crust underline-offset-2 hover:underline">
              {signup ? "Log in" : "Bake an account"}
            </button>
          </p>
        </form>

        <p className="mt-5 text-center text-xs text-cream/55">
          Your raw browsing stays on your device. Only summaries you approve leave it.
        </p>
      </div>
    </main>
  );
}
