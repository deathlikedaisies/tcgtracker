import type { SessionCoachInsight } from "@/lib/session-coach";

export type PostSaveFocusSummary = {
  missionProgress: number;
  focusProgress: number | null;
  remaining: number;
  signalLine: string | null;
  missionCopy: string;
};

function hasDistinctContextProgress(
  insight: SessionCoachInsight,
  focusProgress: number | null,
  missionProgress: number
) {
  if (focusProgress === null) {
    return false;
  }

  return (
    focusProgress !== missionProgress ||
    insight.missionContextTargetCount !== insight.progressGoal
  );
}

export function buildPostSaveFocusSummary(
  insight: SessionCoachInsight,
  countedTowardMission: boolean,
  countedTowardContext: boolean
): PostSaveFocusSummary {
  const missionProgress = Math.min(insight.progressCompleted, insight.progressGoal);
  const focusProgress = Math.min(
    insight.missionContextSeenCount,
    insight.missionContextTargetCount
  );
  const remaining = Math.max(insight.progressGoal - missionProgress, 0);
  const includeContextLine =
    countedTowardContext &&
    hasDistinctContextProgress(insight, focusProgress, missionProgress);
  const signalLine = `${insight.missionTitle}: ${missionProgress}/${insight.progressGoal} games logged.${
    includeContextLine
      ? ` ${insight.missionContextLabel}: ${focusProgress}/${insight.missionContextTargetCount}.`
      : ""
  }`;

  const missionCopy = !countedTowardMission
    ? "This game is outside the current focus, but it still updates your wider history."
    : insight.completionLesson
      ? insight.completionLesson
      : insight.missionGuidanceMode === "investigation"
        ? remaining > 0
          ? `${remaining} more log${remaining === 1 ? "" : "s"} will tell us whether this is a real pattern.`
          : "This pattern is strong enough to review."
        : insight.missionGuidanceMode === "priority_watchlist"
          ? remaining > 0
            ? `${remaining} more watchlist game${remaining === 1 ? "" : "s"} until the read is ready.`
            : "This is strong enough to review before changing your list."
          : remaining > 0
            ? `${remaining} more game${remaining === 1 ? "" : "s"} until this read is ready.`
            : "This focused sample is ready to review.";

  return {
    missionProgress,
    focusProgress,
    remaining,
    signalLine,
    missionCopy,
  };
}
