export const FEEDBACK_TYPES = [
  "Bug",
  "Confusing / unclear",
  "Mobile layout issue",
  "Coaching insight felt wrong",
  "Slow / performance issue",
  "Suggestion",
  "Other",
] as const;

export const FEEDBACK_PAGE_AREAS = [
  "Dashboard",
  "Log game",
  "Match history",
  "Decks",
  "Matchups",
  "Review",
  "Profile",
  "Public profile / report",
  "Signup / login",
  "Other",
] as const;

export const FEEDBACK_SEVERITIES = [
  "Blocker",
  "Annoying",
  "Minor",
  "Suggestion",
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type FeedbackPageArea = (typeof FEEDBACK_PAGE_AREAS)[number];
export type FeedbackSeverity = (typeof FEEDBACK_SEVERITIES)[number];

export function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

export function isFeedbackPageArea(
  value: string
): value is FeedbackPageArea {
  return FEEDBACK_PAGE_AREAS.includes(value as FeedbackPageArea);
}

export function isFeedbackSeverity(
  value: string
): value is FeedbackSeverity {
  return FEEDBACK_SEVERITIES.includes(value as FeedbackSeverity);
}
