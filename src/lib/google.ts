const SCOPES = [
  // Calendar + Meet link (funciona com Gmail pessoal)
  "https://www.googleapis.com/auth/calendar.events",
  // Meet REST API (Workspace); mantido como fallback
  "https://www.googleapis.com/auth/meetings.space.created",
  "openid",
  "email",
  "profile",
].join(" ");

export function isGoogleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getGoogleAuthUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao trocar código OAuth: ${text}`);
  }

  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    id_token?: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao renovar token: ${text}`);
  }

  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };
}

export type GoogleUserInfo = {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
};

export async function getGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao obter perfil Google: ${text}`);
  }

  const data = (await res.json()) as {
    email?: string;
    name?: string;
    picture?: string;
    sub?: string;
  };

  return {
    email: data.email ?? "",
    name: data.name ?? "",
    picture: data.picture,
    sub: data.sub,
  };
}

/** Verifica id_token JWT do Google (aud/iss/exp via tokeninfo). */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) {
    throw new Error("id_token inválido");
  }

  const data = (await res.json()) as {
    aud?: string;
    azp?: string;
    iss?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
    sub?: string;
    exp?: string;
  };

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || (data.aud !== clientId && data.azp !== clientId)) {
    throw new Error("id_token com audience inválida");
  }

  const iss = data.iss ?? "";
  if (
    iss !== "https://accounts.google.com" &&
    iss !== "accounts.google.com"
  ) {
    throw new Error("id_token com issuer inválido");
  }

  if (data.exp && Number(data.exp) * 1000 < Date.now()) {
    throw new Error("id_token expirado");
  }

  const verified =
    data.email_verified === true || data.email_verified === "true";
  if (!data.email || !verified) {
    throw new Error("e-mail Google não verificado");
  }

  return {
    email: data.email.toLowerCase(),
    name: data.name ?? "",
    picture: data.picture,
    sub: data.sub,
  };
}

export async function createMeetSpace(accessToken: string) {
  const res = await fetch("https://meet.googleapis.com/v2/spaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao criar espaço Meet: ${text}`);
  }

  return (await res.json()) as {
    name: string;
    meetingUri: string;
    meetingCode: string;
  };
}

type CalendarMeetInput = {
  summary: string;
  date: string;
  start: string;
  end: string;
  timeZone?: string;
};

/** Cria evento no Calendar com Google Meet (recomendado para Gmail). */
export async function createMeetViaCalendar(
  accessToken: string,
  input: CalendarMeetInput,
) {
  const timeZone = input.timeZone ?? "America/Sao_Paulo";
  const startTime = normalizeClock(input.start);
  const endTime = normalizeClock(input.end);
  const requestId = `neura-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: "Sessão criada pelo Neura",
        start: {
          dateTime: `${input.date}T${startTime}`,
          timeZone,
        },
        end: {
          dateTime: `${input.date}T${endTime}`,
          timeZone,
        },
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao criar Meet via Calendar: ${text}`);
  }

  const data = (await res.json()) as {
    id?: string;
    hangoutLink?: string;
    conferenceData?: {
      entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
    };
  };

  const meetingUri =
    data.hangoutLink ||
    data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri;

  if (!meetingUri) {
    throw new Error("Google Calendar não retornou o link do Meet.");
  }

  return {
    name: data.id ?? "",
    meetingUri,
    meetingCode: "",
  };
}

function normalizeClock(value: string) {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return trimmed;
}

/** Tenta Calendar (Gmail) e, se falhar por outro motivo, Meet REST. */
export async function createMeetLink(
  accessToken: string,
  input: CalendarMeetInput,
) {
  try {
    return await createMeetViaCalendar(accessToken, input);
  } catch (calendarError) {
    try {
      return await createMeetSpace(accessToken);
    } catch {
      throw calendarError instanceof Error
        ? calendarError
        : new Error("Não foi possível criar o link do Meet.");
    }
  }
}

export function isGoogleScopeError(message: string) {
  return (
    message.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
    message.includes("insufficient authentication scopes") ||
    message.includes("insufficientPermissions")
  );
}
