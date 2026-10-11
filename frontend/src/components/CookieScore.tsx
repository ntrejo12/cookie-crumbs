/** The crumb score badge: a chocolate chip cookie with the score in the middle. */
export default function CookieScore({ score, size = 96 }: { score: number; size?: number }) {
  return (
    <div
      role="img"
      aria-label={`Crumb score ${score} out of 100`}
      className="relative shrink-0 motion-safe:animate-pop"
      style={{ width: size, height: size }}
    >
      <img src="/popup/cookie-chocchip.svg" alt="" className="h-full w-full select-none object-contain" draggable={false} />
      <span
        className="absolute inset-0 flex items-center justify-center font-serif font-bold tabular-nums text-chip"
        style={{ fontSize: size * 0.34 }}
      >
        {score}
      </span>
    </div>
  );
}
