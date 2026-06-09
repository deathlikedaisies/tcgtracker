type SixPrizerLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  variant?: "primary" | "app-icon" | "favicon" | "watermark";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showWordmark?: boolean;
  hideTextOnMobile?: boolean;
};

const shellSizes = {
  sm: "size-8",
  md: "size-10 sm:size-11",
  lg: "size-12 sm:size-14",
};

const wordmarkSizes = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl sm:text-2xl",
};

export function SixPrizerLogo({
  className = "",
  markClassName = "",
  textClassName = "",
  variant = "primary",
  size = "md",
  showText = true,
  showWordmark,
  hideTextOnMobile = false,
}: SixPrizerLogoProps) {
  const shouldShowText = showWordmark ?? showText;
  const isWatermark = variant === "watermark";
  const defaultMarkClassName = isWatermark
    ? "text-[#4F8CFF] opacity-60"
    : variant === "app-icon"
      ? `flex ${shellSizes[size]} items-center justify-center rounded-md bg-[#07111F] shadow-[0_0_28px_rgba(79,140,255,0.16),inset_0_0_0_1px_rgba(79,140,255,0.30)]`
      : variant === "favicon"
        ? "flex size-8 items-center justify-center rounded bg-[#0B1020] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]"
        : `flex ${shellSizes[size]} items-center justify-center rounded-md bg-[#07111F] shadow-[0_0_28px_rgba(79,140,255,0.16),inset_0_0_0_1px_rgba(79,140,255,0.30)]`;
  const textVisibility = hideTextOnMobile ? "hidden sm:inline" : "";

  return (
    <div
      aria-label="SixPrizer"
      className={`flex items-center gap-3 ${className}`}
      role="img"
    >
      <span className={`${defaultMarkClassName} ${markClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/sixprizer_icon.png"
          alt=""
          aria-hidden="true"
          className={`${isWatermark ? "size-full opacity-50" : "size-full"} object-contain`}
          draggable={false}
        />
      </span>
      {shouldShowText ? (
        <span className={`font-semibold ${wordmarkSizes[size]} ${textVisibility} ${textClassName}`}>
          <span className="text-[#F8FAFC]">Six</span>
          <span className="text-[#F5C84C]">Prizer</span>
        </span>
      ) : (
        <span className="sr-only">SixPrizer</span>
      )}
    </div>
  );
}
