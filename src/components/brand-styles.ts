export const appShell =
  "min-h-screen w-full max-w-full overflow-x-hidden bg-[#06101F] bg-[radial-gradient(ellipse_at_20%_0%,rgba(79,140,255,0.18),transparent_34%),radial-gradient(ellipse_at_85%_15%,rgba(124,58,237,0.10),transparent_30%),linear-gradient(180deg,#07111F_0%,#0B1020_48%,#050A14_100%)] px-4 py-4 text-[#F8FAFC] sm:px-6 sm:py-6";

export const marketingShell =
  "min-h-screen w-full max-w-full overflow-x-hidden bg-[#06101F] bg-[radial-gradient(ellipse_at_18%_10%,rgba(79,140,255,0.22),transparent_34%),radial-gradient(ellipse_at_78%_22%,rgba(245,200,76,0.08),transparent_24%),linear-gradient(180deg,#06101F_0%,#0B1020_48%,#050A14_100%)] text-[#F8FAFC]";

export const appContainer = "mx-auto flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden sm:gap-5";

export const appFrame =
  "mx-auto grid w-full max-w-7xl min-w-0 gap-4 overflow-x-hidden lg:grid-cols-[224px_minmax(0,1fr)]";

export const appMain = "flex min-w-0 flex-col gap-4 overflow-x-hidden sm:gap-5";

export const pageHeader =
  "rounded-[26px] bg-[linear-gradient(180deg,rgba(15,26,45,0.94),rgba(7,17,31,0.86))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(148,163,184,0.09)] flex flex-col gap-3 backdrop-blur lg:flex-row lg:items-start lg:justify-between sm:p-5";

export const pageHeaderCard = pageHeader;

export const logoOnDark = {
  variant: "app-icon" as const,
  size: "sm" as const,
  hideTextOnMobile: true,
  className: "group transition hover:scale-[1.02]",
  markClassName: "size-8 bg-[#1A2238] transition group-hover:shadow-[0_0_22px_rgba(79,140,255,0.22)]",
  textClassName: "text-sm text-[#F8FAFC]",
};

export const pageTitle = "mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl";

export const pageCopy = "mt-1.5 max-w-2xl text-sm leading-6 text-[#94A3B8]/78";

export const sectionTitle = "text-lg font-semibold tracking-tight text-[#F8FAFC]/95 sm:text-xl";

export const sectionCopy = "text-sm leading-6 text-[#94A3B8]/72";

export const card =
  "rounded-[22px] bg-[linear-gradient(180deg,rgba(15,26,45,0.90),rgba(7,17,31,0.84))] p-3.5 shadow-[0_16px_42px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(148,163,184,0.08)] backdrop-blur sm:p-4";

export const cardLarge =
  "rounded-[26px] bg-[linear-gradient(180deg,rgba(15,26,45,0.92),rgba(7,17,31,0.88))] p-4 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.09)] backdrop-blur sm:p-5";

export const glassPanel =
  "rounded-[26px] bg-[#0B1020]/52 shadow-[0_18px_54px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.11)] backdrop-blur";

export const glassPanelStrong =
  "rounded-[26px] bg-[linear-gradient(180deg,rgba(15,26,45,0.88),rgba(7,17,31,0.92))] shadow-[0_24px_72px_rgba(0,0,0,0.32),0_0_42px_rgba(79,140,255,0.055),inset_0_0_0_1px_rgba(148,163,184,0.12)] backdrop-blur";

export const emptyCard =
  "rounded-[26px] bg-[#0F1A2D]/66 p-6 shadow-[0_18px_52px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(79,140,255,0.16)] sm:p-8";

export const divider = "divide-y divide-white/6";

export const label = "text-sm font-medium text-[#F8FAFC]";

export const input =
  "w-full max-w-full min-w-0 rounded-[14px] bg-[#07111F]/72 px-3 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)] outline-none transition placeholder:text-[#94A3B8]/52 focus:bg-[#07111F]/86 focus:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.68),0_0_20px_rgba(79,140,255,0.10)]";

export const inputH10 = `h-10 ${input}`;

export const inputH11 = `h-11 ${input}`;

export const textarea = `${input} py-2`;

export const primaryButton =
  "inline-flex h-11 max-w-full items-center justify-center rounded-[14px] bg-[#F5C84C] px-4 text-sm font-semibold text-[#07111F] shadow-[0_14px_34px_rgba(245,200,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#94A3B8] sm:h-10";

export const secondaryButton =
  "inline-flex h-11 max-w-full items-center justify-center rounded-[14px] bg-[#4F8CFF]/9 px-4 text-sm font-medium text-[#F8FAFC]/92 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18),0_8px_20px_rgba(79,140,255,0.05)] transition hover:-translate-y-0.5 hover:bg-[#4F8CFF]/15 hover:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.32),0_10px_24px_rgba(79,140,255,0.08)] active:translate-y-0 active:scale-[0.98] sm:h-10";

export const dangerButton =
  "inline-flex h-11 max-w-full items-center justify-center rounded-[14px] bg-[#F43F5E]/10 px-4 text-sm font-medium text-rose-200 transition hover:bg-[#F43F5E]/16 sm:h-10";

export const subtlePill =
  "rounded-full bg-[#07111F]/58 px-2.5 py-1 text-xs text-[#94A3B8]/86 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]";

export const metricCard =
  "rounded-[20px] bg-[#0B1020]/42 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]";

export const primaryPanel = cardLarge;
export const secondaryPanel = card;
export const statCard = metricCard;
export const missionHeroCard = cardLarge;
export const missionMiniCard = card;
export const insightCard = card;
export const formSectionCard = glassPanelStrong;
export const emptyStateCard = emptyCard;
export const compactChip = subtlePill;
