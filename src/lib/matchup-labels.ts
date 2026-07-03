export type MatchupLabelInput = {
  matches: number;
  winRateValue: number;
};

export function getMatchupCoachLabel(matchup: MatchupLabelInput) {
  if (matchup.matches < 10) {
    const gamesNeeded = Math.max(10 - matchup.matches, 1);
    return {
      label: "Needs more data",
      className: "bg-[#F5C84C]/14 text-[#FFE28A]",
      action:
        matchup.matches <= 1
          ? `Only ${matchup.matches} game logged. Log ${gamesNeeded} more before treating this matchup as a real trend.`
          : `Small sample. Log ${gamesNeeded} more games before treating this matchup as a reliable read.`,
    };
  }

  if (matchup.winRateValue >= 60) {
    return {
      label: "Favorable",
      className: "bg-emerald-500/14 text-emerald-200",
      action: "Good signal. Keep the plan stable and verify after more logged games.",
    };
  }

  if (matchup.winRateValue <= 40) {
    return {
      label: "Problem matchup",
      className: "bg-[#F43F5E]/14 text-rose-200",
      action:
        "When this matchup appears, tag the first thing that breaks. Do not change the list until the pattern is clear.",
    };
  }

  if (matchup.winRateValue >= 45 && matchup.winRateValue <= 55) {
    return {
      label: "Even read",
      className: "bg-sky-500/14 text-sky-200",
      action:
        "Close matchup. The sample is large enough to avoid chasing noise, but there is no clear edge yet.",
    };
  }

  if (matchup.winRateValue > 55) {
    return {
      label: "Slight edge",
      className: "bg-emerald-500/14 text-emerald-200",
      action: "Slight positive read. Keep logging cleanly before treating it as favored.",
    };
  }

  return {
    label: "Slight concern",
    className: "bg-[#F5C84C]/14 text-[#F5C84C]",
    action: "Slight negative read. Keep tagging first issues before making list changes.",
  };
}

export function getHeadlineSignal(matchup: MatchupLabelInput | null) {
  if (!matchup || matchup.matches < 10) {
    return "Needs more games";
  }

  if (matchup.winRateValue >= 60) {
    return "Favorable";
  }

  if (matchup.winRateValue <= 40) {
    return "Problem matchup";
  }

  if (matchup.winRateValue >= 45 && matchup.winRateValue <= 55) {
    return "Even read";
  }

  return matchup.winRateValue > 55 ? "Slight edge" : "Slight concern";
}
