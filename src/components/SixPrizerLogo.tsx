type SixPrizerLogoProps = {
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

function SixPrizerMark({
  variant = "primary",
  className = "",
}: {
  variant?: NonNullable<SixPrizerLogoProps["variant"]>;
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
        <circle cx="12" cy="11.4" r="2.7" fill="#F5C84C" />
        <circle cx="12" cy="11.4" r="1" fill="#0B1020" />
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
        fill={isWatermark ? "none" : "#07111F"}
        stroke={isWatermark ? "currentColor" : "#4F8CFF"}
        strokeLinejoin="round"
        strokeWidth={isAppIcon ? "2.3" : "1.7"}
      />
      <path
        d="M12 7.2 15.7 9.3v4.1L12 16.4l-3.7-3V9.3L12 7.2Z"
        stroke={isWatermark ? "currentColor" : "#F5C84C"}
        strokeLinejoin="round"
        strokeWidth={isAppIcon ? "2" : "1.5"}
      />
      {[8.9, 10.75, 12.6].map((x) => (
        <circle
          key={`top-${x}`}
          cx={x}
          cy="10.7"
          r={isAppIcon ? "0.68" : "0.58"}
          fill={isWatermark ? "currentColor" : "#F8FAFC"}
        />
      ))}
      {[11.4, 13.25, 15.1].map((x) => (
        <circle
          key={`bottom-${x}`}
          cx={x}
          cy="13.1"
          r={isAppIcon ? "0.68" : "0.58"}
          fill={isWatermark ? "currentColor" : "#F8FAFC"}
        />
      ))}
    </svg>
  );
}

export function SixPrizerLogo({
  className = "",
  markClassName = "",
  textClassName = "",
  variant = "primary",
  showText = true,
  hideTextOnMobile = false,
}: SixPrizerLogoProps) {
  const isWatermark = variant === "watermark";
  const defaultMarkClassName = isWatermark
    ? "text-[#4F8CFF]"
    : variant === "app-icon"
      ? "flex size-9 items-center justify-center rounded bg-[#07111F] shadow-[0_0_24px_rgba(79,140,255,0.13),inset_0_0_0_1px_rgba(79,140,255,0.26)]"
      : variant === "favicon"
        ? "flex size-8 items-center justify-center rounded bg-[#0B1020] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]"
        : "flex size-9 items-center justify-center rounded-md bg-[#07111F] shadow-[0_0_24px_rgba(79,140,255,0.13),inset_0_0_0_1px_rgba(79,140,255,0.28)]";
  const textVisibility = hideTextOnMobile ? "hidden sm:inline" : "";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`${defaultMarkClassName} ${markClassName}`}>
        <SixPrizerMark variant={variant} />
      </span>
      {showText ? (
        <span className={`font-semibold ${textVisibility} ${textClassName}`}>
          SixPrizer
        </span>
      ) : null}
    </div>
  );
}
