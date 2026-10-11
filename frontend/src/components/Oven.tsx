import type { ReactNode } from "react";

/**
 * The pink oven from the mockup, drawn with CSS border-image: the knobs + label panel and the
 * oven's sides keep their proportions, and only the window (where children sit) grows taller.
 * Slice sizes are in pixels of oven.png (998px wide). The title goes in the oven's label.
 */
const OVEN_W = 998;
const SLICE = { top: 275, right: 41, bottom: 54, left: 40 };
const cq = (n: number) => `${(n / OVEN_W) * 100}cqw`;

interface OvenProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Oven({ title, children, className = "" }: OvenProps) {
  return (
    <div className={`relative min-w-0 [container-type:inline-size] ${className}`}>
      <h2
        className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-sans font-bold text-[#B27270]"
        style={{ top: cq(114), fontSize: cq(24) }}
      >
        {title}
      </h2>
      <div
        style={{
          borderStyle: "solid",
          borderWidth: `${cq(SLICE.top)} ${cq(SLICE.right)} ${cq(SLICE.bottom)} ${cq(SLICE.left)}`,
          borderImageSource: "url(/crumbtrail/oven.png)",
          borderImageSlice: `${SLICE.top} ${SLICE.right} ${SLICE.bottom} ${SLICE.left} fill`,
          borderImageRepeat: "stretch",
        }}
      >
        {children}
      </div>
    </div>
  );
}
