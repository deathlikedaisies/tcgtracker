import { AuthForm } from "@/components/auth/AuthForm";
import { glassPanelStrong, marketingShell, pageCopy } from "@/components/brand-styles";
import { BrandLogo } from "@/components/BrandLogo";
import { getOptionalSupabaseConfig } from "@/lib/supabase-config";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    signup?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { signup } = await searchParams;
  const authConfigured = Boolean(getOptionalSupabaseConfig());
  let shouldRedirect = false;
  const initialMessage =
    signup === "success"
      ? {
          message:
            "Account created. Check your inbox and spam folder for the SixPrizer confirmation email before logging in.",
          variant: "success" as const,
        }
      : null;

  if (authConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        shouldRedirect = true;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Unable to read Supabase user on login page", {
          name: error.name,
          message: error.message,
        });
      }
    }
  }

  if (shouldRedirect) {
    redirect("/dashboard");
  }

  return (
    <main className={`flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 ${marketingShell}`}>
      <section className={`w-full max-w-sm p-5 sm:p-6 ${glassPanelStrong}`}>
        <div className="mb-6">
          <BrandLogo variant="horizontal" size="sm" />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
            Log in to SixPrizer
          </h1>
          <p className={pageCopy}>
            Access your SixPrizer dashboard.
          </p>
        </div>
        <AuthForm
          mode="login"
          authConfigured={authConfigured}
          initialMessage={initialMessage}
        />
      </section>
    </main>
  );
}
