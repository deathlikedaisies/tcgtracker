"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase";

type SignOutButtonProps = {
  className?: string;
  compact?: boolean;
};

export function SignOutButton({
  className = "",
  compact = false,
}: SignOutButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 text-xs font-medium text-[#C7D3E7] transition hover:bg-white/8 hover:text-[#F8FAFC] ${compact ? "w-auto" : "w-full"} ${className}`}
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      Sign out
    </button>
  );
}
