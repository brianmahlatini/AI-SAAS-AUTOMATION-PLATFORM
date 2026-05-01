export function formatDate(value?: string): string {
  if (!value) {
    return "Never";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}
