export const appShell =
  "min-h-screen w-full max-w-full overflow-x-hidden bg-[#0B1020] bg-[radial-gradient(ellipse_at_top,rgba(79,140,255,0.12),transparent_42%),linear-gradient(180deg,#0B1020_0%,#10172A_52%,#0B1020_100%)] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-8";

export const appContainer = "mx-auto flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden sm:gap-6";

export const pageHeader =
  "rounded-md bg-[#0B1020]/30 p-3 shadow-[0_16px_54px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(248,250,252,0.045)] flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between";

export const logoOnDark = {
  variant: "app-icon" as const,
  hideTextOnMobile: true,
  className: "group transition hover:scale-[1.02]",
  markClassName: "size-8 bg-[#1A2238] transition group-hover:shadow-[0_0_22px_rgba(79,140,255,0.22)]",
  textClassName: "text-sm text-[#F8FAFC]",
};

export const pageTitle = "mt-2 text-3xl font-semibold tracking-tight text-[#F8FAFC] sm:text-4xl";

export const pageCopy = "mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]/78";

export const sectionTitle = "text-lg font-semibold tracking-tight text-[#F8FAFC] sm:text-xl";

export const sectionCopy = "text-sm leading-6 text-[#94A3B8]/76";

export const card =
  "rounded-md bg-[#11182C]/72 p-4 shadow-[0_18px_46px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(248,250,252,0.045)] sm:p-5";

export const cardLarge =
  "rounded-md bg-[#11182C]/72 p-4 shadow-[0_20px_54px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(248,250,252,0.045)] sm:p-6";

export const emptyCard =
  "rounded-md bg-[#11182C]/58 p-6 shadow-[0_18px_52px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:p-8";

export const divider = "divide-y divide-white/6";

export const label = "text-sm font-medium text-[#F8FAFC]";

export const input =
  "w-full max-w-full min-w-0 rounded-md bg-[#0B1020]/62 px-3 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)] outline-none transition placeholder:text-[#94A3B8]/60 focus:bg-[#0B1020]/78 focus:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.7),0_0_24px_rgba(79,140,255,0.1)]";

export const inputH10 = `h-10 ${input}`;

export const inputH11 = `h-11 ${input}`;

export const textarea = `${input} py-2`;

export const primaryButton =
  "inline-flex h-10 max-w-full items-center justify-center rounded-md bg-[#F5C84C] px-4 text-sm font-semibold text-[#0B1020] shadow-[0_12px_30px_rgba(245,200,76,0.20)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#94A3B8]";

export const secondaryButton =
  "inline-flex h-10 max-w-full items-center justify-center rounded-md bg-[#4F8CFF]/10 px-4 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16),0_10px_24px_rgba(79,140,255,0.06)] transition hover:-translate-y-0.5 hover:bg-[#4F8CFF]/16 hover:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.36),0_10px_28px_rgba(79,140,255,0.10)] active:translate-y-0 active:scale-[0.98]";

export const dangerButton =
  "inline-flex h-10 max-w-full items-center justify-center rounded-md bg-[#F43F5E]/10 px-4 text-sm font-medium text-rose-200 transition hover:bg-[#F43F5E]/16";

export const subtlePill =
  "rounded-md bg-[#0B1020]/50 px-2 py-1 text-xs text-[#94A3B8]/86";
