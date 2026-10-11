const LESSONS = [
  {
    q: "What's a cookie, anyway?",
    a: "A tiny note a website saves in your browser so it remembers you between pages: what's in your cart, that you're logged in, your language. Most of these are useful.",
  },
  {
    q: "First-party vs. third-party cookies",
    a: "First-party cookies come from the site you're actually on. Third-party cookies come from other companies embedded in the page, like ad networks and social buttons. Because the same company shows up on thousands of sites, it can connect your visits into one profile.",
  },
  {
    q: "What counts as a tracker?",
    a: "Any outside service that collects information about your visit. Some use cookies, some don't. Cookie Crumbs checks every third-party request against a known tracker list.",
  },
  {
    q: "Fingerprinting: the crumb you can't sweep up",
    a: "Some trackers identify your device from details like screen size, fonts and graphics card. No cookie is stored, so clearing cookies doesn't remove it.",
  },
  {
    q: "What does the crumb score mean?",
    a: "A number from 0 to 100 for how much tracking a site does. Higher means more crumbs left behind. It's based on how many trackers there are and what kind they are.",
  },
  {
    q: "How does Cookie Crumbs guess unknown trackers?",
    a: "We check the known tracker list first. If a domain isn't on it, an open-source AI model looks at how it behaves and makes a guess, with a confidence score. Guesses are always labeled as guesses, and we never call something malicious without proof.",
  },
  {
    q: "What stays on my device?",
    a: "Your raw browsing stays in your browser. Only summaries you choose to save are stored, so you can compare sites over time.",
  },
];

/** Behind the crumbs: plain-English explanations, expandable and keyboard friendly. */
export default function CookieClassView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-chip sm:text-4xl">Behind the crumbs</h1>
        <p className="mt-1 text-cocoa">Everything on this dashboard, explained without the jargon.</p>
      </header>

      <div className="grid items-start gap-3 lg:grid-cols-2">
        {LESSONS.map((l, i) => (
          <details
            key={l.q}
            open={i === 0}
            className="group rounded-2xl border-2 border-crust bg-cream px-5 py-4 open:shadow-[0_8px_24px_rgba(61,38,24,0.1)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-bold text-chip outline-none focus-visible:underline [&::-webkit-details-marker]:hidden">
              {l.q}
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-dough text-chip transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-cocoa">{l.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
