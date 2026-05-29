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

function SixPrizerMark({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: NonNullable<SixPrizerLogoProps["variant"]>;
  size?: NonNullable<SixPrizerLogoProps["size"]>;
  className?: string;
}) {
  if (variant === "favicon") {
    return (
      <svg
        aria-hidden="true"
        className={`size-[76%] ${className}`}
        fill="none"
        viewBox="0 0 64 64"
      >
        <path
          d="M32 5.5 53.5 17.7v21.1L32 58.5 10.5 38.8V17.7L32 5.5Z"
          fill="#07111F"
          stroke="#F5C84C"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path
          d="M32 12.4 47.1 21v14.7L32 51.6 16.9 35.7V21L32 12.4Z"
          stroke="#4F8CFF"
          strokeLinejoin="round"
          strokeWidth="2.4"
        />
        <path
          d="m32 21.3 2.7 6 6.5.7-4.8 4.4 1.3 6.4L32 35.5l-5.7 3.3 1.3-6.4-4.8-4.4 6.5-.7L32 21.3Z"
          fill="#F5C84C"
        />
      </svg>
    );
  }

  const isWatermark = variant === "watermark";
  const isCompact = size === "sm";
  const nodeFill = isWatermark ? "currentColor" : "#F8FAFC";
  const nodeStroke = isWatermark ? "currentColor" : "#4F8CFF";
  const prizeNodes = [
    [32, 16.4],
    [45.5, 24.2],
    [45.5, 39.8],
    [32, 47.6],
    [18.5, 39.8],
    [18.5, 24.2],
  ];

  return (
    <svg
      aria-hidden="true"
      className={`${isWatermark ? "size-full" : "size-[76%]"} ${className}`}
      fill="none"
      viewBox="0 0 64 64"
    >
      <path
        d="M32 5.5 53.5 17.7v21.1L32 58.5 10.5 38.8V17.7L32 5.5Z"
        fill={isWatermark ? "none" : "#07111F"}
        stroke={isWatermark ? "currentColor" : "#F5C84C"}
        strokeLinejoin="round"
        strokeWidth={isWatermark ? "2.4" : "3.4"}
      />
      <path
        d="M32 12.4 47.1 21v14.7L32 51.6 16.9 35.7V21L32 12.4Z"
        stroke={isWatermark ? "currentColor" : "#4F8CFF"}
        strokeLinejoin="round"
        strokeWidth={isWatermark ? "1.8" : "2.2"}
      />
      {isCompact ? null : (
        <path
          d="M32 16.4 45.5 24.2M45.5 24.2v15.6M45.5 39.8 32 47.6M32 47.6 18.5 39.8M18.5 39.8V24.2M18.5 24.2 32 16.4"
          stroke={isWatermark ? "currentColor" : "#4F8CFF"}
          strokeOpacity={isWatermark ? "0.32" : "0.38"}
          strokeWidth="1.5"
        />
      )}
      {prizeNodes.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={isCompact ? "2.2" : "3.1"}
          fill={isCompact && !isWatermark ? "#F5C84C" : nodeFill}
          stroke={isCompact ? "none" : nodeStroke}
          strokeWidth={isCompact ? "0" : "1.3"}
        />
      ))}
      <path
        d="m32 21.3 2.7 6 6.5.7-4.8 4.4 1.3 6.4L32 35.5l-5.7 3.3 1.3-6.4-4.8-4.4 6.5-.7L32 21.3Z"
        fill={isWatermark ? "currentColor" : "#F5C84C"}
      />
      <path
        d="M32 24.7v9.7M27.2 29.5h9.6"
        stroke="#07111F"
        strokeLinecap="round"
        strokeWidth="1.7"
        opacity={isWatermark ? "0" : "0.7"}
      />
    </svg>
  );
}

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
    ? "text-[#4F8CFF]"
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
        <SixPrizerMark variant={variant} size={size} />
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
