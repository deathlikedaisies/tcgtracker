export const appBackground =
  "bg-[#06101F] bg-[radial-gradient(ellipse_at_20%_0%,rgba(79,140,255,0.12),transparent_30%),radial-gradient(ellipse_at_82%_14%,rgba(79,140,255,0.05),transparent_22%),linear-gradient(180deg,#07111F_0%,#0B1020_48%,#050A14_100%)]";

export const marketingBackground =
  "bg-[#06101F] bg-[radial-gradient(ellipse_at_18%_8%,rgba(79,140,255,0.14),transparent_30%),radial-gradient(ellipse_at_78%_18%,rgba(245,200,76,0.05),transparent_20%),linear-gradient(180deg,#06101F_0%,#0B1020_48%,#050A14_100%)]";

export const appShell =
  `min-h-screen w-full max-w-full overflow-x-hidden ${appBackground} px-4 py-4 text-[#F8FAFC] sm:px-6 sm:py-6`;

export const marketingShell =
  `min-h-screen w-full max-w-full overflow-x-hidden ${marketingBackground} text-[#F8FAFC]`;

export const appContainer = "mx-auto flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden sm:gap-5";

export const appFrame =
  "mx-auto grid w-full max-w-7xl min-w-0 gap-4 overflow-x-hidden lg:grid-cols-[224px_minmax(0,1fr)]";

export const appMain = "flex min-w-0 flex-col gap-4 overflow-x-hidden sm:gap-5";

const premiumSurfaceBase =
  "bg-[linear-gradient(180deg,rgba(15,26,45,0.96),rgba(8,17,31,0.90))] shadow-[0_20px_48px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur";

const metallicOverlay =
  "linear-gradient(135deg,rgba(255,255,255,0.05),transparent_24%,rgba(79,140,255,0.035)_48%,rgba(245,200,76,0.035)_74%,transparent_88%)";

const metallicTopEdge =
  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,rgba(79,140,255,0.28),rgba(255,255,255,0.07),rgba(245,200,76,0.22))] before:content-['']";

export const pageHeader =
  `relative overflow-hidden rounded-[26px] p-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between sm:p-5 ${premiumSurfaceBase} ${metallicTopEdge} after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top_left,rgba(79,140,255,0.10),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(245,200,76,0.05),transparent_24%)] after:content-['']`;

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
  `relative overflow-hidden rounded-[22px] p-3.5 sm:p-4 ${premiumSurfaceBase} before:pointer-events-none before:absolute before:inset-0 before:bg-[${metallicOverlay}] before:content-['']`;

export const cardLarge =
  `relative overflow-hidden rounded-[26px] p-4 sm:p-5 ${premiumSurfaceBase} ${metallicTopEdge} before:pointer-events-none before:absolute before:inset-0 before:bg-[${metallicOverlay}] before:content-['']`;

export const glassPanel =
  "relative overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(12,20,36,0.88),rgba(8,16,29,0.82))] shadow-[0_16px_40px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_26%,rgba(79,140,255,0.025)_52%,rgba(245,200,76,0.02)_76%,transparent_88%)] before:content-['']";

export const glassPanelStrong =
  `relative overflow-hidden rounded-[26px] ${premiumSurfaceBase} ${metallicTopEdge} before:pointer-events-none before:absolute before:inset-0 before:bg-[${metallicOverlay}] before:content-[''] after:pointer-events-none after:absolute after:-left-12 after:top-0 after:h-36 after:w-36 after:rounded-full after:bg-[#4F8CFF]/[0.08] after:blur-3xl after:content-['']`;

export const emptyCard =
  "relative overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(14,24,42,0.90),rgba(8,17,31,0.84))] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(148,163,184,0.11),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur sm:p-8";

export const divider = "divide-y divide-white/6";

export const label = "text-sm font-medium text-[#F8FAFC]";

export const input =
  "w-full max-w-full min-w-0 rounded-[14px] bg-[#07111F]/72 px-3 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)] outline-none transition placeholder:text-[#94A3B8]/52 focus:bg-[#07111F]/86 focus:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.68),0_0_20px_rgba(79,140,255,0.10)]";

export const inputH10 = `h-10 ${input}`;

export const inputH11 = `h-11 ${input}`;

export const textarea = `${input} py-2`;

export const primaryButton =
  "inline-flex h-11 max-w-full items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#F7D365,#F5C84C)] px-4 text-sm font-semibold text-[#07111F] shadow-[0_16px_36px_rgba(245,200,76,0.24),inset_0_1px_0_rgba(255,255,255,0.32),0_0_0_1px_rgba(245,200,76,0.18)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#ffe082,#f6cf59)] hover:shadow-[0_20px_40px_rgba(245,200,76,0.28),inset_0_1px_0_rgba(255,255,255,0.36),0_0_0_1px_rgba(245,200,76,0.22)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#94A3B8] sm:h-10";

export const secondaryButton =
  "inline-flex h-11 max-w-full items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,rgba(17,29,49,0.92),rgba(9,17,31,0.86))] px-4 text-sm font-medium text-[#F8FAFC]/92 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18),inset_0_1px_0_rgba(255,255,255,0.04),0_12px_28px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(21,35,59,0.94),rgba(10,20,36,0.88))] hover:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.30),inset_0_1px_0_rgba(255,255,255,0.05),0_16px_30px_rgba(79,140,255,0.08)] active:translate-y-0 active:scale-[0.98] sm:h-10";

export const dangerButton =
  "inline-flex h-11 max-w-full items-center justify-center rounded-[14px] bg-[#F43F5E]/10 px-4 text-sm font-medium text-rose-200 transition hover:bg-[#F43F5E]/16 sm:h-10";

export const subtlePill =
  "rounded-full bg-[linear-gradient(180deg,rgba(11,16,32,0.84),rgba(7,17,31,0.74))] px-2.5 py-1 text-xs text-[#94A3B8]/86 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)]";

export const metricCard =
  "relative overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,rgba(11,18,32,0.82),rgba(8,14,26,0.72))] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.09),inset_0_1px_0_rgba(255,255,255,0.03)]";

export const accentGlow = "shadow-[0_0_18px_rgba(79,140,255,0.12)]";

export const primaryPanel = cardLarge;
export const secondaryPanel = card;
export const statCard = metricCard;
export const missionHeroCard =
  "relative overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(15,26,45,0.97),rgba(8,17,31,0.92))] p-4 shadow-[0_24px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.12),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_22%,rgba(79,140,255,0.035)_44%,rgba(245,200,76,0.035)_70%,transparent_86%)] before:content-[''] after:pointer-events-none after:absolute after:-left-10 after:top-0 after:h-36 after:w-36 after:rounded-full after:bg-[#4F8CFF]/[0.09] after:blur-3xl after:content-[''] sm:p-5";
export const missionMiniCard = card;
export const insightCard = card;
export const formSectionCard = glassPanelStrong;
export const emptyStateCard = emptyCard;
export const compactChip = subtlePill;
export const premiumInset =
  "rounded-[22px] bg-[linear-gradient(180deg,rgba(11,18,32,0.74),rgba(8,14,26,0.64))] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08),inset_0_1px_0_rgba(255,255,255,0.02)]";
export const premiumInsetStrong =
  "rounded-[20px] bg-[linear-gradient(180deg,rgba(13,22,38,0.82),rgba(8,14,26,0.72))] shadow-[0_14px_34px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)]";
export const premiumTile =
  "rounded-[18px] bg-[linear-gradient(180deg,rgba(11,18,32,0.76),rgba(8,14,26,0.66))] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08),inset_0_1px_0_rgba(255,255,255,0.03)]";
export const interactiveTile =
  "rounded-[18px] bg-[linear-gradient(180deg,rgba(11,18,32,0.78),rgba(8,14,26,0.68))] shadow-[0_14px_34px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(148,163,184,0.08),inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(14,24,42,0.84),rgba(9,17,31,0.74))] hover:shadow-[0_18px_38px_rgba(0,0,0,0.20),inset_0_0_0_1px_rgba(79,140,255,0.14),inset_0_1px_0_rgba(255,255,255,0.04)]";
export const metallicBadge =
  "rounded-full bg-[linear-gradient(180deg,rgba(11,16,32,0.82),rgba(7,17,31,0.76))] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)]";
export const navRailPanel =
  "relative overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(12,20,36,0.92),rgba(8,16,29,0.84))] shadow-[0_18px_42px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_26%,rgba(79,140,255,0.025)_50%,rgba(245,200,76,0.025)_78%,transparent_88%)] before:content-['']";
export const navItem =
  "inline-flex h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-medium text-[#94A3B8]/78 transition hover:bg-[#07111F]/58 hover:text-[#F8FAFC]";
export const navItemActive =
  "inline-flex h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-medium bg-[linear-gradient(180deg,rgba(79,140,255,0.20),rgba(31,67,138,0.18))] text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28),inset_0_1px_0_rgba(255,255,255,0.05),0_12px_26px_rgba(79,140,255,0.10)]";
export const premiumPageSurface = pageHeaderCard;
export const premiumPanel = glassPanel;
export const premiumPanelStrong = glassPanelStrong;
export const premiumCard = card;
export const premiumStatCard = statCard;
export const premiumHeroCard = missionHeroCard;
export const premiumSidebar = navRailPanel;
export const premiumChip = compactChip;
export const premiumBadge = metallicBadge;
export const primaryGoldButton = primaryButton;
export const secondaryGlassButton = secondaryButton;
