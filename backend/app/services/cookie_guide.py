GUIDE = [
    {
        "topic": "What is a cookie?",
        "keywords": ["what is a cookie", "what are cookies", "cookie mean", "cookies work", "how do cookies"],
        "text": "A cookie is a small piece of data a website stores in your browser. Sites use "
                "them to remember things like your login, language or shopping cart. Cookies "
                "are not programs: they can't run code or install viruses by themselves.",
    },
    {
        "topic": "First-party vs third-party cookies",
        "keywords": ["first-party", "first party", "third-party", "third party", "difference between"],
        "text": "First-party cookies are set by the site you are visiting. Third-party cookies "
                "are set by other domains embedded in the page, such as ad or analytics services. "
                "Third-party cookies can help a service recognize you across different sites, "
                "which is why many browsers offer settings to limit or block them.",
    },
    {
        "topic": "Session vs persistent cookies",
        "keywords": ["session", "persistent", "expire", "how long", "lifetime", "last"],
        "text": "Session cookies disappear when you close the browser. Persistent cookies have "
                "an expiry date and can last for months or even years. Long-lived cookies matter "
                "more for privacy because they let a service recognize you over a longer time.",
    },
    {
        "topic": "Cookie security flags",
        "keywords": ["secure", "httponly", "samesite", "flag", "attribute"],
        "text": "Secure means the cookie is only sent over HTTPS. HttpOnly means page scripts "
                "cannot read it. SameSite limits when it is sent on cross-site requests. These "
                "flags mostly protect against attacks; they do not stop a site from tracking you.",
    },
    {
        "topic": "Tracking pixels",
        "keywords": ["pixel", "web beacon", "beacon", "email tracking"],
        "text": "A tracking pixel is a tiny image or script request that tells a server you "
                "loaded a page or email. It does not need a cookie, but it can carry your IP "
                "address, device details, or an existing cookie ID.",
    },
    {
        "topic": "Browser fingerprinting",
        "keywords": ["fingerprint", "without cookies", "clearing cookies not enough", "track me without"],
        "text": "Fingerprinting combines details about your browser and device, like screen "
                "size, fonts and settings, to recognize you without cookies. Clearing cookies "
                "does not remove it. Browsers with built-in fingerprinting protection help.",
    },
    {
        "topic": "Global Privacy Control and Do Not Track",
        "keywords": ["global privacy control", "gpc", "do not track", "dnt"],
        "text": "Global Privacy Control is a browser setting that tells sites you don't want "
                "your data sold or shared. In some regions, privacy laws treat it as an opt-out "
                "request. The older Do Not Track signal is widely ignored by websites.",
    },
    {
        "topic": "Cookie consent banners",
        "keywords": ["banner", "consent", "accept all", "reject all", "gdpr", "ccpa", "law", "legal"],
        "text": "Cookie banners ask permission for non-essential cookies, such as advertising "
                "and analytics. Choosing 'reject all' or 'necessary only' usually limits "
                "tracking. Rules differ by country, so this is general information, not legal advice.",
    },
    {
        "topic": "Clearing cookies",
        "keywords": ["clear", "delete cookies", "remove cookies", "erase"],
        "text": "You can clear cookies in your browser's privacy settings under 'clear browsing "
                "data'. This signs you out of sites and resets many tracking IDs, but sites can "
                "set new cookies the next time you visit.",
    },
    {
        "topic": "Private/incognito mode",
        "keywords": ["incognito", "private mode", "private browsing", "private window"],
        "text": "Private mode keeps your browsing history and cookies from being saved on your "
                "device after you close the window. It does not hide your activity from "
                "websites, your internet provider, your school or your employer.",
    },
    {
        "topic": "Blockers and VPNs",
        "keywords": ["blocker", "ublock", "adblock", "vpn", "protect", "stop tracking", "reduce tracking"],
        "text": "A content blocker such as uBlock Origin blocks requests to known trackers. A "
                "VPN hides your IP address from websites but does not stop cookies or "
                "fingerprinting. Blocking third-party cookies and rejecting optional cookies "
                "in banners also helps.",
    },
    {
        "topic": "Site permissions",
        "keywords": ["permission", "location", "camera", "microphone", "notification", "geolocation"],
        "text": "Sites can ask for permissions like location, camera, microphone and "
                "notifications. Review them in your browser's site settings and remove "
                "any you don't need.",
    },
    {
        "topic": "The Cookie Crumbs privacy score",
        "keywords": ["score", "privacy score", "rating", "what does my score mean"],
        "text": "The privacy score is an estimate from 0 to 100 based on the trackers, cookies "
                "and permissions seen on a site. Higher is better. It is a guide, not a "
                "guarantee that a site is safe or unsafe.",
    },
    {
        "topic": "Unverified trackers",
        "keywords": ["unverified", "estimate", "not in the list", "unknown tracker", "confidence"],
        "text": "A tracker marked unverified is not in our known tracker list, so its category "
                "is an AI estimate with a confidence level. It may be wrong, and it does not "
                "mean the service is harmful.",
    },
]


def retrieve(question: str, k: int = 3) -> list[dict]:
    q = question.lower()
    scored = []
    for entry in GUIDE:
        score = sum(1 for kw in entry["keywords"] if kw in q)
        if score:
            scored.append((score, entry))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [entry for _, entry in scored[:k]]