/** Public site origin — Railway/Next often exposes request.url as localhost:8080. */
export function getPublicOrigin(request: Request): string {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (forwardedHost) {
    return `${forwardedProto || "https"}://${forwardedHost}`;
  }

  for (const raw of [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.GOOGLE_REDIRECT_URI,
  ]) {
    if (!raw) continue;
    try {
      return new URL(raw).origin;
    } catch {
      /* ignore */
    }
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    return `https://${railwayDomain.replace(/^https?:\/\//, "")}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function absoluteUrl(request: Request, path: string): URL {
  return new URL(path, getPublicOrigin(request));
}
