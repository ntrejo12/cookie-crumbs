/** The crumb score badge: a chocolate chip cookie with the score in the middle ("N/A" until scores are ready). */
export default function CookieScore({ score, size = 96 }: { score: number | null; size?: number }) {
  return (
    <div
      role="img"
      aria-label={score === null ? "Crumb score not available yet" : `Crumb score ${score} out of 100`}
      className="relative shrink-0 motion-safe:animate-pop"
      style={{ width: size, height: size }}
    >
      <img src="/popup/cookie-chocchip.svg" alt="" className="h-full w-full select-none object-contain" draggable={false} />
      <span
        className="absolute inset-0 flex items-center justify-center font-serif font-bold tabular-nums text-chip"
        style={{ fontSize: size * (score === null ? 0.26 : 0.34) }}
      >
        {score ?? "N/A"}
      </span>
    </div>
  );
}
