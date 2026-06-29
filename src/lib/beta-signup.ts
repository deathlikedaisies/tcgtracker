import "server-only";

import { ADMIN_EMAIL } from "@/lib/admin-analytics";
import {
  createAdminSupabaseClient,
  hasAdminSupabaseConfig,
} from "@/lib/supabase-admin";

export const BETA_INVITE_ONLY_MESSAGE =
  "This beta is invite-only right now. Please check the code and try again.";
export const BETA_FULL_MESSAGE =
  "The current beta wave is full. More spots will open soon.";

type BetaSignupValidation =
  | { ok: true }
  | { ok: false; message: string };

export type BetaSignupStatus = {
  inviteGateEnabled: boolean;
  inviteCodeConfigured: boolean;
  maxBetaUsers: number | null;
  currentBetaUsers: number | null;
  remainingSpots: number | null;
  canCountUsers: boolean;
};

function getInviteCode() {
  return (process.env.BETA_INVITE_CODE ?? "").trim();
}

export function isBetaInviteGateEnabled() {
  return Boolean(getInviteCode()) || process.env.NODE_ENV === "production";
}

function getMaxBetaUsers() {
  const raw = (process.env.MAX_BETA_USERS ?? "").trim();
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function countAuthUsersExcludingAdmin() {
  const admin = createAdminSupabaseClient();
  let page = 1;
  let count = 0;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(`Unable to count beta users: ${error.message}`);
    }

    count += data.users.filter(
      (user) => user.email?.toLowerCase() !== ADMIN_EMAIL
    ).length;

    if (data.users.length < 1000) {
      break;
    }

    page += 1;
  }

  return count;
}

export async function getBetaSignupStatus(): Promise<BetaSignupStatus> {
  const maxBetaUsers = getMaxBetaUsers();
  const canCountUsers = hasAdminSupabaseConfig();
  let currentBetaUsers: number | null = null;

  if (maxBetaUsers !== null && canCountUsers) {
    currentBetaUsers = await countAuthUsersExcludingAdmin();
  }

  return {
    inviteGateEnabled: isBetaInviteGateEnabled(),
    inviteCodeConfigured: Boolean(getInviteCode()),
    maxBetaUsers,
    currentBetaUsers,
    remainingSpots:
      maxBetaUsers !== null && currentBetaUsers !== null
        ? Math.max(0, maxBetaUsers - currentBetaUsers)
        : null,
    canCountUsers,
  };
}

export async function validateBetaSignup(
  inviteCode: string
): Promise<BetaSignupValidation> {
  const configuredInviteCode = getInviteCode();

  if (isBetaInviteGateEnabled()) {
    if (
      !configuredInviteCode ||
      inviteCode.trim() !== configuredInviteCode
    ) {
      return { ok: false, message: BETA_INVITE_ONLY_MESSAGE };
    }
  }

  const maxBetaUsers = getMaxBetaUsers();
  if (maxBetaUsers === null) {
    return { ok: true };
  }

  if (!hasAdminSupabaseConfig()) {
    console.error(
      "MAX_BETA_USERS is configured but SUPABASE_SERVICE_ROLE_KEY is unavailable for signup cap enforcement."
    );
    return { ok: false, message: BETA_FULL_MESSAGE };
  }

  const currentBetaUsers = await countAuthUsersExcludingAdmin();
  if (currentBetaUsers >= maxBetaUsers) {
    return { ok: false, message: BETA_FULL_MESSAGE };
  }

  return { ok: true };
}
