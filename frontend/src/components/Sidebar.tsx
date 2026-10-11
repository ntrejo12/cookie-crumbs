export type View = "jar" | "trail" | "taste" | "class" | "settings";

const NAV: { id: View; title: string; sub: string }[] = [
  { id: "jar", title: "Cookie jar", sub: "Overview" },
  { id: "trail", title: "Crumb trail", sub: "Who's tracking you" },
  { id: "taste", title: "Crumb test", sub: "Compare sites" },
  { id: "class", title: "Behind the crumbs", sub: "Learn" },
  { id: "settings", title: "Settings", sub: "Account & privacy" },
];

export interface User {
  name: string;
  email: string;
}

interface SidebarProps {
  view: View;
  onChange: (v: View) => void;
  /** null = browsing as a guest (e.g. opened straight from the extension) */
  user: User | null;
  onLogout: () => void;
  onLogin: () => void;
}

export default function Sidebar({ view, onChange, user, onLogout, onLogin }: SidebarProps) {
  const authButton = user ? (
    <button type="button" onClick={onLogout} className="text-sm font-semibold text-dough hover:underline">
      Log out
    </button>
  ) : (
    <button type="button" onClick={onLogin} className="text-sm font-semibold text-dough hover:underline">
      Log in
    </button>
  );

  return (
    <aside className="relative z-20 bg-crumbs-bg text-cream lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-5 lg:px-6 lg:pt-7">
        <img src="/logo.png" alt="" className="h-10 w-auto" />
        <span className="font-serif text-xl font-bold">Cookie Crumbs</span>
        <span className="ml-auto lg:hidden">{authButton}</span>
      </div>

      <nav
        aria-label="Dashboard sections"
        className="mt-4 flex gap-2 overflow-x-auto px-4 pb-4 lg:mt-8 lg:flex-col lg:overflow-visible lg:px-4 lg:pb-0"
      >
        {NAV.map((item) => {
          const active = item.id === view;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dough lg:py-3 ${
                active ? "bg-white/15" : "hover:bg-white/8"
              }`}
            >
              <span className="block text-[15px] font-bold">{item.title}</span>
              <span className="block text-xs text-cream/70">{item.sub}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden border-t border-white/10 px-6 py-5 lg:mt-auto lg:block">
        {user ? (
          <>
            <p className="truncate text-sm font-semibold text-cream">{user.name}</p>
            <p className="truncate text-xs text-cream/70" title={user.email}>
              {user.email}
            </p>
          </>
        ) : (
          <p className="text-sm text-cream/80">Browsing as a guest</p>
        )}
        <div className="mt-1">{authButton}</div>
      </div>
    </aside>
  );
}
