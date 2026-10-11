/** A row of little cookie crumbs, used as a divider. Same crumb style as the login page. */

// fixed pseudo-random so the crumbs don't move between renders
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const SHAPES = [
  "42% 58% 46% 54% / 50% 44% 56% 50%",
  "35%",
  "50%",
  "60% 40% 55% 45% / 45% 60% 40% 55%",
  "30% 50% 40% 60%",
];

const COUNT = 28;
const CRUMBS = Array.from({ length: COUNT }, (_, i) => {
  const r = (n: number) => rand(i * 11 + n);
  // bigger in the middle, trailing off toward the ends
  const fromCenter = Math.abs(i - (COUNT - 1) / 2) / ((COUNT - 1) / 2);
  const size = Math.round(5 + (1 - fromCenter) * 7 + r(1) * 4);
  return {
    size,
    shape: SHAPES[Math.floor(r(2) * SHAPES.length)],
    rotate: Math.round(r(3) * 360),
    offsetY: Math.round((r(4) - 0.5) * 8),
    border: size > 11 ? 2.5 : 2,
  };
});

export default function CrumbDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`mx-auto flex max-w-2xl items-center justify-between px-2 ${className}`}>
      {CRUMBS.map((c, i) => (
        <span
          key={i}
          className="shrink-0 border-[#1E1209]"
          style={{
            width: c.size,
            height: c.size,
            borderWidth: c.border,
            borderRadius: c.shape,
            rotate: `${c.rotate}deg`,
            translate: `0 ${c.offsetY}px`,
            // tan crumb with the darker baked corner, like the logo crumbs
            background: "linear-gradient(225deg, #EABC86 55%, #D9A877 56%)",
          }}
        />
      ))}
    </div>
  );
}
