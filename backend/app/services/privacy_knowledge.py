CATEGORY_KNOWLEDGE = {
    "advertising": {
        "data_collected": [
            "the pages you visit and how often",
            "ads you see or click",
            "your device and browser details",
            "an ID that can link your activity across different sites",
        ],
        "possible_uses": [
            "build an interest profile to show you targeted ads",
            "measure whether an ad led to a purchase",
            "follow your browsing across unrelated websites",
        ],
        "protections": [
            "Use a content blocker such as uBlock Origin to block ad trackers",
            "Block third-party cookies in your browser settings",
            "Turn on Global Privacy Control or 'Do Not Track' in your browser",
            "Reduce ad personalization in your Google/Meta account settings",
        ],
    },
    "analytics": {
        "data_collected": [
            "which pages you view and for how long",
            "clicks, scrolling and other on-page behavior",
            "your device, browser and approximate location",
        ],
        "possible_uses": [
            "count visitors and see which pages are popular",
            "find confusing parts of the site",
            "in some tools, replay how visitors move through a page",
        ],
        "protections": [
            "Decline optional or analytics cookies in consent banners",
            "Use a content blocker to block third-party analytics",
            "Clear cookies regularly so visits are harder to link over time",
        ],
    },
    "social": {
        "data_collected": [
            "that you visited the page, even if you never click a social button",
            "your social account ID if you are logged in there",
            "likes, shares and other interactions",
        ],
        "possible_uses": [
            "connect your browsing to your social media profile",
            "personalize the ads and content you see on that platform",
        ],
        "protections": [
            "Log out of social sites when you are not using them",
            "Block social media widgets with a content blocker",
            "Use a separate browser profile for social media",
        ],
    },
    "fingerprinting": {
        "data_collected": [
            "details about your browser and device, such as screen size and fonts",
        ],
        "possible_uses": [
            "recognize your device even if you clear cookies",
        ],
        "protections": [
            "Use a browser with built-in fingerprinting protection",
            "Keep your browser updated and limit unnecessary extensions",
        ],
    },
    "cdn": {
        "data_collected": [
            "your IP address and basic request details needed to deliver files",
        ],
        "possible_uses": [
            "deliver images, scripts and fonts faster",
        ],
        "protections": [
            "Usually low concern; a VPN can hide your IP address if that matters to you",
        ],
    },
    "functional": {
        "data_collected": ["basic request details needed for the site's features to work"],
        "possible_uses": ["power features like logins, payments or embedded content"],
        "protections": ["Usually low concern for privacy"],
    },
    "unknown": {
        "data_collected": ["unclear; there is not enough information to say"],
        "possible_uses": ["unclear; this service is not in the known tracker list"],
        "protections": ["Review what the site asks for and block third-party cookies if unsure"],
    },
}

PERMISSION_KNOWLEDGE = {
    "geolocation": "can see where you physically are",
    "camera": "can use your camera",
    "microphone": "can listen through your microphone",
    "notifications": "can send you push notifications",
    "clipboard": "can read or change what you copy and paste",
}

GENERAL_PROTECTIONS = [
    "Review your browser's site permissions and remove any you do not need",
    "Clear cookies and site data from time to time",
]