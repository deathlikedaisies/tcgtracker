export const appShell =
  "min-h-screen bg-[#0B1020] px-4 py-7 text-[#F8FAFC] sm:px-6 sm:py-10";

export const appContainer = "mx-auto flex w-full flex-col gap-6";

export const pageHeader =
  "flex flex-col gap-4 border-b border-white/5 pb-5 lg:flex-row lg:items-start lg:justify-between";

export const logoOnDark = {
  markClassName: "size-8 bg-[#1A2238] shadow-[0_0_24px_rgba(79,140,255,0.18)]",
  textClassName: "text-sm text-[#F8FAFC]",
};

export const pageTitle = "mt-2 text-4xl font-semibold tracking-tight text-[#F8FAFC]";

export const pageCopy = "mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]/85";

export const sectionTitle = "text-xl font-semibold text-[#F8FAFC]";

export const sectionCopy = "text-sm leading-6 text-[#94A3B8]/85";

export const card =
  "rounded-md bg-[#1A2238]/72 p-5 shadow-[0_16px_46px_rgba(0,0,0,0.2)]";

export const cardLarge =
  "rounded-md bg-[#1A2238]/72 p-5 shadow-[0_16px_46px_rgba(0,0,0,0.2)] sm:p-6";

export const emptyCard =
  "rounded-md bg-[#1A2238]/50 p-6 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)] sm:p-8";

export const divider = "divide-y divide-white/6";

export const label = "text-sm font-medium text-[#F8FAFC]";

export const input =
  "rounded-md bg-[#0B1020]/65 px-3 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.08)] outline-none transition placeholder:text-[#94A3B8]/70 focus:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.78)]";

export const inputH10 = `h-10 ${input}`;

export const inputH11 = `h-11 ${input}`;

export const textarea = `${input} py-2`;

export const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#F5C84C] px-4 text-sm font-semibold text-[#0B1020] transition hover:bg-[#ffd85f] disabled:cursor-not-allowed disabled:bg-[#94A3B8]";

export const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#4F8CFF]/10 px-4 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28)] transition hover:bg-[#4F8CFF]/16 hover:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.62)]";

export const dangerButton =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#F43F5E]/10 px-4 text-sm font-medium text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.22)] transition hover:bg-[#F43F5E]/16";

export const subtlePill =
  "rounded-md bg-[#0B1020]/70 px-2 py-1 text-xs text-[#94A3B8]";
