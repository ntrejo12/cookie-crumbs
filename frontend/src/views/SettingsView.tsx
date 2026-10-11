import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { User } from "../components/Sidebar";

/** Frontend-only for now: settings are saved in this browser. Swap for a backend call later. */
const SETTINGS_KEY = "cc-settings";

interface Prefs {
  saveHistory: boolean;
  aiExplanations: boolean;
  shareSummaries: boolean;
}
const DEFAULT_PREFS: Prefs = { saveHistory: false, aiExplanations: true, shareSummaries: false };

function loadPrefs(): Prefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}

const card = "rounded-2xl border-2 border-crust bg-cream p-5 sm:p-6";
const inputClass =
  "w-full rounded-xl border-2 border-line bg-white px-4 py-2.5 text-[15px] text-chip outline-none transition placeholder:text-[#B39A7E] focus:border-dough focus:ring-4 focus:ring-dough/40 disabled:bg-parchment disabled:text-cocoa";
const primaryBtn =
  "rounded-full bg-chip px-5 py-2.5 text-sm font-bold text-cream transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-dough/60 disabled:opacity-50";
const secondaryBtn =
  "rounded-full border-2 border-line bg-white px-5 py-2 text-sm font-semibold text-chip transition hover:bg-parchment focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-dough/40";

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className="font-serif text-xl font-bold text-chip">{title}</h2>
      <p className="mb-4 text-sm text-cocoa">{sub}</p>
      {children}
    </section>
  );
}

function Toggle({ label, help, checked, onChange }: { label: string; help: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/70 py-3.5 last:border-0">
      <div>
        <p className="font-semibold text-chip">{label}</p>
        <p className="text-sm text-cocoa">{help}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-2 border-[#1E1209] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-dough/50 ${
          checked ? "bg-[#C6E3AA]" : "bg-white"
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-[#1E1209] bg-[#F6C090] transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

interface SettingsViewProps {
  user: User | null;
  onUpdateUser: (u: User) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  /** Clears the scans saved on this device */
  onClearHistory?: () => void;
}

export default function SettingsView({
  user,
  onUpdateUser,
  onLogout,
  onDeleteAccount,
  onLogin,
  onSignUp,
  onClearHistory,
}: SettingsViewProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState("");
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [historyCleared, setHistoryCleared] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage blocked: settings just won't persist */
    }
  }, [prefs]);

  const setPref = (k: keyof Prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  const saveAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setSaved("Name and email can't be empty.");
      return;
    }
    onUpdateUser({ name: name.trim(), email: email.trim() });
    setSaved("Saved!");
    setTimeout(() => setSaved(""), 2000);
  };

  const downloadData = () => {
    const blob = new Blob([JSON.stringify({ user, settings: prefs }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cookie-crumbs-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-chip sm:text-4xl">Settings</h1>
        <p className="mt-1 text-cocoa">Your account, your privacy, your crumbs.</p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Account */}
        <Section title="Account" sub="Who's holding the cookie jar.">
          {user ? (
            <form onSubmit={saveAccount} noValidate className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-chip">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-chip">Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
              </label>
              <div className="flex items-center gap-3">
                <button type="submit" className={primaryBtn}>
                  Save changes
                </button>
                <span aria-live="polite" className="text-sm font-semibold text-cocoa">
                  {saved}
                </span>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-chip">You're browsing as a guest. Log in or bake an account to keep your settings and history.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={onLogin} className={primaryBtn}>
                  Log in
                </button>
                <button type="button" onClick={onSignUp} className={secondaryBtn}>
                  Bake an account
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Privacy */}
        <Section title="Privacy" sub="What Cookie Crumbs is allowed to keep. Everything starts off unless it's needed.">
          <Toggle
            label="Save my scan history"
            help="Keep summaries of sites you scan so you can compare them over time."
            checked={prefs.saveHistory}
            onChange={setPref("saveHistory")}
          />
          <Toggle
            label="AI explanations for unknown trackers"
            help="Let the AI guess what unfamiliar domains do. Guesses are always labeled."
            checked={prefs.aiExplanations}
            onChange={setPref("aiExplanations")}
          />
          <Toggle
            label="Share anonymous summaries"
            help="Help improve the tracker list. Never includes your browsing history."
            checked={prefs.shareSummaries}
            onChange={setPref("shareSummaries")}
          />
        </Section>

        {/* Data */}
        <Section title="Your Data" sub="Take it with you or sweep it away.">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={downloadData} className={secondaryBtn}>
              Download my data
            </button>
            <button type="button" onClick={() => {
                onClearHistory?.();
                setHistoryCleared(true);
              }} className={secondaryBtn}>
              Clear scan history
            </button>
            {historyCleared && (
              <span aria-live="polite" className="text-sm font-semibold text-cocoa">
                History cleared.
              </span>
            )}
          </div>
        </Section>

        {/* Session / danger zone */}
        {user && (
          <Section title="Leave The Jar" sub="Log out on this device, or delete your account for good.">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onLogout} className={secondaryBtn}>
                Log out
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Delete your Cookie Crumbs account? This can't be undone.")) onDeleteAccount();
                }}
                className="rounded-full border-2 border-ad bg-white px-5 py-2 text-sm font-semibold text-ad transition hover:bg-[#F8E1DC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ad/30"
              >
                Delete account
              </button>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
