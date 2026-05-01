type ApiOptions = RequestInit & {
  json?: unknown;
};

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");

  if (options.json !== undefined) {
    headers.set("content-type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    if (process.env.NODE_ENV === "development") {
      headers.set("x-user-id", "dev-user");
      headers.set("x-user-role", localStorage.getItem("automation-dev-role") ?? "ADMIN");
      headers.set("x-user-email", "dev@example.com");
    }
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    const message = payload?.error?.message ?? `Request failed with ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function safeJson(
  response: Response
): Promise<{ error?: { message?: string } } | undefined> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
