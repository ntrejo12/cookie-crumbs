import type { SiteScan } from "../data/mockScans";

interface Props {scan: SiteScan;}

const card = "rounded-2xl border-2 border-crust bg-cream p-5";

function showNumber(value: number | null | undefined) {
  return value ?? "Unknown";
}

function settingLabel(setting: string | undefined) {
  switch (setting) {
    case "allow":
      return "Allowed";
    case "block":
      return "Blocked";
    case "ask":
      return "Ask";
    default:
      return "Unknown";
  }
}

export default function PrivacyDetails({ scan }: Props) {
  const cookies = scan.cookieAnalysis;
  const permissions = scan.permissionSettings;

  const cookieRows = [
    ["First-party cookies", cookies?.first_party_count],
    [
      "Stored third-party domain cookies",
      cookies?.third_party_domain_count,
    ],
    ["Secure cookies", cookies?.secure_count],
    ["HttpOnly cookies", cookies?.http_only_count],
    ["Session cookies", cookies?.session_count],
    ["Persistent cookies", cookies?.persistent_count],
    ["SameSite=None cookies", cookies?.same_site_none_count],
    ["Partitioned cookies", cookies?.partitioned_count],
  ] as const;

  const permissionRows = [
    ["Location", permissions?.location],
    ["Notifications", permissions?.notifications],
    ["Camera", permissions?.camera],
    ["Microphone", permissions?.microphone],
  ] as const;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className={card}>
        <h2 className="font-serif text-xl font-bold text-chip">
          Cookie Analysis
        </h2>

        <p className="mt-1 text-sm text-cocoa">
          Cookie metadata found in Chrome's cookie store.
          Counts are not proof that cookies were sent
          during this visit.
        </p>

        <dl className="mt-4 divide-y divide-line">
          {cookieRows.map(([label, count]) => (
            <div
              key={label}
              className="flex items-center justify-between
                         gap-4 py-2 text-sm"
            >
              <dt className="text-cocoa">{label}</dt>

              <dd className="font-semibold text-chip">
                {showNumber(count)}
              </dd>
            </div>
          ))}
        </dl>

        {cookies?.incomplete && (
          <p className="mt-3 text-xs text-cocoa">
            Some third-party cookie domains could not be
            inspected. Results may be incomplete.
          </p>
        )}
      </div>

      <div className={card}>
        <h2 className="font-serif text-xl font-bold text-chip">
          Site Permissions
        </h2>

        <p className="mt-1 text-sm text-cocoa">
          Effective Chrome site settings. An "Ask"
          setting does not mean the site requested access.
        </p>

        <dl className="mt-4 divide-y divide-line">
          {permissionRows.map(([label, setting]) => (
            <div
              key={label}
              className="flex items-center justify-between
                         gap-4 py-2 text-sm"
            >
              <dt className="text-cocoa">{label}</dt>

              <dd className="font-semibold text-chip">
                {settingLabel(setting)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
