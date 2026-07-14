export type MatchupHeatmapInput = {
  matches: number;
  winRateValue: number;
};

export type MatchupHeatmapRead = {
  confidenceLabel:
    | "No data"
    | "Low sample"
    | "Developing read"
    | "Useful sample"
    | "Strong read";
  interpretationLabel:
    | "No data"
    | "Do not overreact yet"
    | "Keep testing"
    | "Problem matchup"
    | "Even read"
    | "Favored read";
  summary: string;
  tone: "empty" | "low" | "developing" | "problem" | "even" | "favored";
  isActionableProblem: boolean;
};

export function getMatchupHeatmapRead({
  matches,
  winRateValue,
}: MatchupHeatmapInput): MatchupHeatmapRead {
  if (matches <= 0) {
    return {
      confidenceLabel: "No data",
      interpretationLabel: "No data",
      summary: "No games logged yet.",
      tone: "empty",
      isActionableProblem: false,
    };
  }

  if (matches <= 4) {
    return {
      confidenceLabel: "Low sample",
      interpretationLabel: "Do not overreact yet",
      summary: "Low sample. Log more before treating this as a trend.",
      tone: "low",
      isActionableProblem: false,
    };
  }

  if (matches <= 9) {
    return {
      confidenceLabel: "Developing read",
      interpretationLabel: "Keep testing",
      summary: "Developing read. Keep testing before changing the list.",
      tone: "developing",
      isActionableProblem: false,
    };
  }

  const confidenceLabel = matches >= 20 ? "Strong read" : "Useful sample";

  if (winRateValue < 40) {
    return {
      confidenceLabel,
      interpretationLabel: "Problem matchup",
      summary: `${confidenceLabel}. Problem matchup worth focused testing.`,
      tone: "problem",
      isActionableProblem: true,
    };
  }

  if (winRateValue > 60) {
    return {
      confidenceLabel,
      interpretationLabel: "Favored read",
      summary: `${confidenceLabel}. Favored read, but keep logging cleanly.`,
      tone: "favored",
      isActionableProblem: false,
    };
  }

  return {
    confidenceLabel,
    interpretationLabel: "Even read",
    summary: `${confidenceLabel}. Close matchup with no clear edge.`,
    tone: "even",
    isActionableProblem: false,
  };
}
