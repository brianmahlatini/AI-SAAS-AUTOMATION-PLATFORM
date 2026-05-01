import Handlebars from "handlebars";

Handlebars.registerHelper("json", (value: unknown) => JSON.stringify(value));

export function renderTemplate(input: unknown, context: Record<string, unknown>): unknown {
  if (typeof input === "string") {
    const template = Handlebars.compile(input, { noEscape: true });
    return template(context);
  }

  if (Array.isArray(input)) {
    return input.map((value) => renderTemplate(value, context));
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [
        key,
        renderTemplate(value, context)
      ])
    );
  }

  return input;
}

export function renderString(input: unknown, context: Record<string, unknown>, fallback = ""): string {
  const rendered = renderTemplate(input ?? fallback, context);
  if (typeof rendered === "string") {
    return rendered;
  }
  return JSON.stringify(rendered);
}
