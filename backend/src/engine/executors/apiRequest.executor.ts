import { AppError } from "../../middleware/error";
import { renderTemplate } from "../template";
import type { NodeExecutor } from "../types";

export const executeApiRequestNode: NodeExecutor = async (node, context) => {
  const data = renderTemplate(node.data ?? {}, {
    trigger: context.trigger,
    steps: context.steps
  }) as Record<string, unknown>;

  const url = String(data.url ?? "");
  if (!url) {
    throw new AppError(400, "API Request node requires a URL", "NODE_CONFIG_INVALID");
  }

  const method = String(data.method ?? "GET").toUpperCase();
  const headers = normalizeHeaders(data.headers);
  const body = data.body;
  const timeoutMs = Number(data.timeoutMs ?? 30_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method)
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body ?? {}),
      signal: controller.signal
    });

    const text = await response.text();
    const parsedBody = parseResponseBody(text);

    return {
      output: {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody
      }
    };
  } finally {
    clearTimeout(timeout);
  }
};

function normalizeHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return { "content-type": "application/json" };
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, headerValue]) => headerValue !== undefined && headerValue !== null)
      .map(([key, headerValue]) => [key, String(headerValue)])
  );
}

function parseResponseBody(text: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
