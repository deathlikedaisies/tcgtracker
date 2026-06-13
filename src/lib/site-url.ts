function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

function getConfiguredSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const normalized = candidate ? normalizeSiteUrl(candidate) : null;
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function getSiteUrl() {
  const configured = getConfiguredSiteUrl();
  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin) ?? "http://localhost:3000";
  }

  return "http://localhost:3000";
}

export function getPublicProfileUrl(handle: string) {
  return `${getSiteUrl()}/u/${handle}`;
}

export function getSharedReportUrl(slug: string) {
  return `${getSiteUrl()}/r/${slug}`;
}

