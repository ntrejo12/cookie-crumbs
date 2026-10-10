const WEBSITE_URL = "http://localhost:5173/";

export default function PopupApp() {
  const openFullJar = () => {
    chrome.tabs.create({ url: WEBSITE_URL });
  };

  return (
    <div className="w-[360px] bg-cream p-5 text-chip">
      <div className="mb-5 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Cookie Crumbs logo"
          className="h-12 w-12 object-contain"
        />
        <div>
          <h1 className="font-serif text-xl font-bold">
            Cookie Crumbs
          </h1>
          <p className="text-xs text-cocoa">
            See who's following your crumbs.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-line p-4">
        <h2 className="font-bold">Your Cookie Jar</h2>
        <p className="mt-2 text-sm text-cocoa">
          Tracker analysis is coming soon.
        </p>
      </div>

      <button
        type="button"
        onClick={openFullJar}
        className="w-full rounded-full bg-chip px-5 py-3
                   font-bold text-cream hover:opacity-90"
      >
        Open the full jar
      </button>
    </div>
  );
}
