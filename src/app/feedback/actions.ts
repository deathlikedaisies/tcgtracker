"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  isFeedbackPageArea,
  isFeedbackSeverity,
  isFeedbackType,
} from "@/lib/feedback";

export type FeedbackFormState = {
  success: string | null;
  error: string | null;
  fieldErrors: {
    type?: string;
    severity?: string;
    message?: string;
  };
  submittedAt: string | null;
};

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function submitFeedbackAction(
  _prevState: FeedbackFormState,
  formData: FormData
): Promise<FeedbackFormState> {
  const { supabase, user } = await requireUser();

  const type = String(formData.get("type") ?? "").trim();
  const pageArea = String(formData.get("page_area") ?? "").trim();
  const severity = String(formData.get("severity") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const path = String(formData.get("path") ?? "/feedback").trim() || "/feedback";
  const contactOk = formData.get("contact_ok") === "on";

  const fieldErrors: FeedbackFormState["fieldErrors"] = {};

  if (!isFeedbackType(type)) {
    fieldErrors.type = "Choose the kind of feedback you want to send.";
  }

  if (!isFeedbackSeverity(severity)) {
    fieldErrors.severity = "Choose how serious this feels.";
  }

  if (message.length < 5) {
    fieldErrors.message = "Add a short description of what happened.";
  } else if (message.length > 2000) {
    fieldErrors.message = "Keep the message under 2000 characters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: null,
      error: "Please fix the highlighted fields.",
      fieldErrors,
      submittedAt: null,
    };
  }

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const normalizedPageArea = pageArea && isFeedbackPageArea(pageArea) ? pageArea : null;

  const { error } = await supabase.from("beta_feedback").insert({
    user_id: user.id,
    type,
    page_area: normalizedPageArea,
    severity,
    message,
    contact_ok: contactOk,
    user_email: user.email ?? null,
    user_agent: userAgent ? userAgent.slice(0, 500) : null,
    path: path.slice(0, 200),
  });

  if (error) {
    console.error("submitFeedbackAction failed", {
      message: error.message,
      code: error.code,
    });

    return {
      success: null,
      error:
        "Could not save feedback. Please try again, or send it in the WhatsApp group.",
      fieldErrors: {},
      submittedAt: null,
    };
  }

  revalidatePath("/feedback");

  return {
    success: "Thanks. Your feedback was saved.",
    error: null,
    fieldErrors: {},
    submittedAt: new Date().toISOString(),
  };
}
