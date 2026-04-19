type MatchStripMatch = {
  id?: string;
  opponent?: string;
  playedAt?: string;
  result: "win" | "loss";
};

type MatchStripProps = {
  matches: MatchStripMatch[];
  max?: number;
};

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function MatchStrip({ matches, max = 10 }: MatchStripProps) {
  const visibleMatches = matches.slice(0, max);

  if (!visibleMatches.length) {
    return (
      <div className="flex gap-1" aria-label="No matches yet">
        {Array.from({ length: Math.min(max, 5) }).map((_, index) => (
          <span
            key={index}
            className="size-2.5 rounded-full bg-[#1A2238]"
          />
        ))}
      </div>
    );
  }

  return (
    <details className="group w-fit max-w-full">
      <summary
        aria-label="Recent match results"
        className="flex cursor-pointer list-none items-center gap-1 marker:hidden"
      >
        {visibleMatches.map((match, index) => (
          <span
            key={match.id ?? `${match.result}-${index}`}
            title={`${match.result.toUpperCase()}${
              match.opponent ? ` vs ${match.opponent}` : ""
            }${match.playedAt ? `, ${formatDate(match.playedAt)}` : ""}`}
            className={`size-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.12)] ${
              match.result === "win" ? "bg-[#22C55E]" : "bg-[#F43F5E]"
            }`}
          />
        ))}
      </summary>
      <div className="mt-2 rounded-md bg-[#0B1020]/72 p-2 text-xs text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)]">
        {visibleMatches.map((match, index) => (
          <p key={match.id ?? `${match.result}-detail-${index}`}>
            {match.result === "win" ? "🟢" : "🔴"} {match.result}
            {match.opponent ? ` vs ${match.opponent}` : ""}
            {match.playedAt ? ` · ${formatDate(match.playedAt)}` : ""}
          </p>
        ))}
      </div>
    </details>
  );
}
