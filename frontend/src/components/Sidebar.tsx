export type View = "jar" | "trail" | "taste" | "class";

const NAV: { id: View; title: string; sub: string }[] = [
  { id: "jar", title: "Cookie jar", sub: "Overview" },
  { id: "trail", title: "Crumb trail", sub: "Tracker graph" },
  { id: "taste", title: "Taste test", sub: "Compare sites" },
  { id: "class", title: "Cookie class", sub: "Learn" },
];

interface SidebarProps {
  view: View;
  onChange: (v: View) => void;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({ view, onChange, userEmail, onLogout }: SidebarProps) {
  return (
    <aside className="bg-crumbs-bg text-cream lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-5 lg:px-6 lg:pt-7">
        <img src="/logo.png" alt="" className="h-10 w-auto" />
        <span className="font-serif text-xl font-bold">Cookie Crumbs</span>
        <button type="button" onClick={onLogout} className="ml-auto text-sm font-semibold text-dough hover:underline lg:hidden">
          Log out
        </button>
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
        <p className="truncate text-xs text-cream/70" title={userEmail}>
          {userEmail}
        </p>
        <button type="button" onClick={onLogout} className="mt-1 text-sm font-semibold text-dough hover:underline">
          Log out
        </button>
      </div>
    </aside>
  );
}
