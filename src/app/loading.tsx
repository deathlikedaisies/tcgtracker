import { PrizeMapLogo } from "@/components/PrizeMapLogo";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1020] bg-[radial-gradient(ellipse_at_center,rgba(79,140,255,0.14),transparent_44%)] px-6 text-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <PrizeMapLogo
          variant="app-icon"
          showText={false}
          className="prizemap-glow-pulse"
          markClassName="size-14 bg-[#11182C] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.26)]"
        />
        <p className="text-sm font-medium text-[#94A3B8]">
          Loading PrizeMap
        </p>
      </div>
    </main>
  );
}
