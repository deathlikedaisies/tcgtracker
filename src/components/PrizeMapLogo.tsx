type PrizeMapLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function PrizeMapLogo({
  className = "",
  markClassName = "",
  textClassName = "",
}: PrizeMapLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`flex size-9 items-center justify-center rounded-md bg-[#0B1020] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28)] ${markClassName}`}
      >
        <svg
          aria-hidden="true"
          className="size-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 3.8 18.8 7.4v6.1L12 20.2 5.2 13.5V7.4L12 3.8Z"
            fill="#0B1020"
            stroke="#4F8CFF"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path
            d="M12 7.3 15.4 9v3.4L12 15.7l-3.4-3.3V9L12 7.3Z"
            stroke="#F5C84C"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M12 10.1v3.5"
            stroke="#F8FAFC"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
          <path
            d="m9.8 11.2 2.2-1.1 2.2 1.1"
            stroke="#F8FAFC"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      </span>
      <span className={`font-semibold ${textClassName}`}>PrizeMap</span>
    </div>
  );
}
