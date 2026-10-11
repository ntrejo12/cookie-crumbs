import { useId } from "react";

// chip positions kept away from the number in the middle and the bite
const CHIPS: [number, number, number][] = [
  [26, 32, 3.4],
  [42, 18, 2.6],
  [22, 62, 3],
  [36, 80, 3.4],
  [62, 82, 2.8],
  [78, 66, 3.4],
  [82, 44, 2.6],
];

/** The cookie badge with a bite out of it and the crumb score in the middle. */
export default function CookieScore({
  score,
  size = 96,
}: {
  score: number | null;
  size?: number;
}) {
  const maskId = `bite-${useId().replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  )}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={
        score === null
          ? "Crumb score not available yet"
          : `Crumb score ${score} out of 100`
      }
      className="shrink-0"
    >
      <defs>
        <mask id={maskId}>
          <rect width="100" height="100" fill="white" />
          <circle cx="88" cy="14" r="17" fill="black" />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="#E3A857"
          stroke="#BC7A2E"
          strokeWidth="3"
        />
        {CHIPS.map(([cx, cy, r]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="#3D2618"
          />
        ))}
      </g>

      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="700"
        fontSize={score === null ? 25 : 32}
        fill="#3D2618"
      >
        {score ?? "N/A"}
      </text>
    </svg>
  );
}