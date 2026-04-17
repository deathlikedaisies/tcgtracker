type PrizeMapLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  variant?: "primary" | "app-icon" | "favicon" | "watermark";
  showText?: boolean;
  hideTextOnMobile?: boolean;
};

const markSizes = {
  primary: "size-6",
  "app-icon": "size-6",
  favicon: "size-5",
  watermark: "size-full",
};

function PrizeMapMark({
  variant = "primary",
  className = "",
}: {
  variant?: NonNullable<PrizeMapLogoProps["variant"]>;
  className?: string;
}) {
  if (variant === "favicon") {
    return (
      <svg
        aria-hidden="true"
        className={`${markSizes[variant]} ${className}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 3.5 18.2 7v6.2L12 20.5 5.8 13.2V7L12 3.5Z"
          fill="#0B1020"
          stroke="#4F8CFF"
          strokeLinejoin="round"
          strokeWidth="2.8"
        />
        <circle cx="12" cy="11.4" r="3" fill="#F5C84C" />
      </svg>
    );
  }

  const isAppIcon = variant === "app-icon";
  const isWatermark = variant === "watermark";

  return (
    <svg
      aria-hidden="true"
      className={`${markSizes[variant]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3.8 18.8 7.4v6.1L12 20.2 5.2 13.5V7.4L12 3.8Z"
        fill={isWatermark ? "none" : "#0B1020"}
        stroke={isWatermark ? "currentColor" : "#4F8CFF"}
        strokeLinejoin="round"
        strokeWidth={isAppIcon ? "2.3" : "1.7"}
      />
      <path
        d="M12 7.3 15.4 9v3.4L12 15.7l-3.4-3.3V9L12 7.3Z"
        stroke={isWatermark ? "currentColor" : "#F5C84C"}
        strokeLinejoin="round"
        strokeWidth={isAppIcon ? "2" : "1.5"}
      />
      <path
        d="M12 10.1v3.5"
        stroke={isWatermark ? "currentColor" : "#F8FAFC"}
        strokeLinecap="round"
        strokeWidth={isAppIcon ? "2" : "1.6"}
      />
      <path
        d="m9.8 11.2 2.2-1.1 2.2 1.1"
        stroke={isWatermark ? "currentColor" : "#F8FAFC"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={isAppIcon ? "1.8" : "1.4"}
      />
    </svg>
  );
}

export function PrizeMapLogo({
  className = "",
  markClassName = "",
  textClassName = "",
  variant = "primary",
  showText = true,
  hideTextOnMobile = false,
}: PrizeMapLogoProps) {
  const isWatermark = variant === "watermark";
  const defaultMarkClassName = isWatermark
    ? "text-[#4F8CFF]"
    : variant === "app-icon"
      ? "flex size-9 items-center justify-center rounded bg-[#0B1020] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]"
      : variant === "favicon"
        ? "flex size-8 items-center justify-center rounded bg-[#0B1020] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]"
        : "flex size-9 items-center justify-center rounded-md bg-[#0B1020] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28)]";
  const textVisibility = hideTextOnMobile ? "hidden sm:inline" : "";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`${defaultMarkClassName} ${markClassName}`}>
        <PrizeMapMark variant={variant} />
      </span>
      {showText ? (
        <span className={`font-semibold ${textVisibility} ${textClassName}`}>
          PrizeMap
        </span>
      ) : null}
    </div>
  );
}
