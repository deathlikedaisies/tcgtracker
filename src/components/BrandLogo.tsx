type BrandLogoProps = {
  variant?: "icon" | "horizontal";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const iconDims = {
  sm: { w: 28, h: 28, cls: "h-7 w-7" },
  md: { w: 40, h: 40, cls: "h-10 w-10" },
  lg: { w: 56, h: 56, cls: "h-14 w-14" },
} as const;

// Horizontal logo natural size: 1989×526. Actual aspect ratio ≈ 3.78:1.
// Width hints are derived from (h * 1989/526), rounded.
// CSS h-* + max-w-full controls the actual rendered size.
const horizontalDims = {
  sm: { w: 106, h: 28, cls: "h-7 w-auto max-w-full" },
  md: { w: 144, h: 38, cls: "h-[38px] w-auto max-w-full" },
  lg: { w: 197, h: 52, cls: "h-[52px] w-auto max-w-full" },
} as const;

export function BrandLogo({
  variant = "icon",
  size = "md",
  className = "",
}: BrandLogoProps) {
  if (variant === "horizontal") {
    const d = horizontalDims[size];
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/sixprizer_horizontal_logo.png"
        alt="SixPrizer"
        width={d.w}
        height={d.h}
        className={`${d.cls} max-w-full object-contain object-left ${className}`}
        draggable={false}
      />
    );
  }

  const d = iconDims[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/sixprizer_icon.png"
      alt="SixPrizer"
      width={d.w}
      height={d.h}
      className={`${d.cls} object-contain ${className}`}
      draggable={false}
    />
  );
}
