"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  type BetaFeedbackCategory,
  type BetaFeedbackRating,
  isFeedbackPageArea,
  isFeedbackSeverity,
  isFeedbackType,
  isBetaFeedbackCategory,
  isBetaFeedbackRating,
} from "@/lib/feedback";

export type FeedbackFormState = {
  success: string | null;
  error: string | null;
  fieldErrors: {
    type?: string;
    severity?: string;
    message?: string;
    rating?: string;
    category?: string;
  };
  submittedAt: string | null;
};

const BETA_PAGE_AREA_BY_CATEGORY: Record<BetaFeedbackCategory, string> = {
  "TCG Live import": "Log game",
  "Review/coaching": "Review",
  "Matchup heatmap": "Matchups",
  "Deck versions": "Decks",
  "Card review": "Decks",
  "Prize race": "Log game",
  Events: "Other",
  Demo: "Other",
  Other: "Other",
};

function getFeedbackTypeForBetaPrompt(category: BetaFeedbackCategory) {
  if (category === "Review/coaching") {
    return "Coaching insight felt wrong";
  }

  if (category === "TCG Live import" || category === "Prize race") {
    return "Confusing / unclear";
  }

  return "Suggestion";
}

function getFeedbackSeverityForBetaPrompt(rating: BetaFeedbackRating) {
  return rating === "Not useful" ? "Annoying" : "Suggestion";
}

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
        "Could not save feedback. Please try again, or send it directly.",
      fieldErrors: {},
      submittedAt: null,
    };
  }

  revalidatePath("/feedback");

  return {
    success: "Feedback saved. Thanks, this helps improve the beta.",
    error: null,
    fieldErrors: {},
    submittedAt: new Date().toISOString(),
  };
}

export async function submitBetaFeedbackPromptAction(
  _prevState: FeedbackFormState,
  formData: FormData
): Promise<FeedbackFormState> {
  const { supabase, user } = await requireUser();

  const rating = String(formData.get("rating") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const pageContext = String(formData.get("page_context") ?? "unknown").trim();
  const path = String(formData.get("path") ?? "/").trim() || "/";
  const fieldErrors: FeedbackFormState["fieldErrors"] = {};

  if (!isBetaFeedbackRating(rating)) {
    fieldErrors.rating = "Choose whether this was useful.";
  }

  if (!isBetaFeedbackCategory(category)) {
    fieldErrors.category = "Choose the product area this feedback is about.";
  }

  if (feedback.length > 1600) {
    fieldErrors.message = "Keep the feedback under 1600 characters.";
  }

  if (contact.length > 160) {
    fieldErrors.message = "Keep the contact field short.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: null,
      error: "Please fix the highlighted fields.",
      fieldErrors,
      submittedAt: null,
    };
  }

  const normalizedRating = rating as BetaFeedbackRating;
  const normalizedCategory = category as BetaFeedbackCategory;
  const message = [
    `Beta prompt rating: ${normalizedRating}`,
    `Category: ${normalizedCategory}`,
    `Page context: ${pageContext || "unknown"}`,
    contact ? `Contact: ${contact}` : null,
    "",
    feedback || "No extra notes provided.",
  ]
    .filter((line) => line !== null)
    .join("\n");
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");

  const { error } = await supabase.from("beta_feedback").insert({
    user_id: user.id,
    type: getFeedbackTypeForBetaPrompt(normalizedCategory),
    page_area: BETA_PAGE_AREA_BY_CATEGORY[normalizedCategory],
    severity: getFeedbackSeverityForBetaPrompt(normalizedRating),
    message,
    contact_ok: Boolean(contact),
    user_email: user.email ?? null,
    user_agent: userAgent ? userAgent.slice(0, 500) : null,
    path: path.slice(0, 200),
  });

  if (error) {
    console.error("submitBetaFeedbackPromptAction failed", {
      message: error.message,
      code: error.code,
    });

    return {
      success: null,
      error: "Could not save feedback. Please try again from the Feedback page.",
      fieldErrors: {},
      submittedAt: null,
    };
  }

  revalidatePath("/feedback");

  return {
    success: "Thanks. This helps improve the beta.",
    error: null,
    fieldErrors: {},
    submittedAt: new Date().toISOString(),
  };
}
