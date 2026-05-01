type Operator = "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "exists";

export function evaluateCondition(input: {
  left: unknown;
  operator?: string;
  right?: unknown;
}): boolean {
  const operator = (input.operator ?? "eq") as Operator;
  const left = coerceComparable(input.left);
  const right = coerceComparable(input.right);

  switch (operator) {
    case "eq":
      return left === right;
    case "neq":
      return left !== right;
    case "contains":
      return String(left).includes(String(right));
    case "gt":
      return Number(left) > Number(right);
    case "gte":
      return Number(left) >= Number(right);
    case "lt":
      return Number(left) < Number(right);
    case "lte":
      return Number(left) <= Number(right);
    case "exists":
      return left !== undefined && left !== null && left !== "";
    default:
      return false;
  }
}

function coerceComparable(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  if (normalized === "null") return null;
  if (normalized !== "" && !Number.isNaN(Number(normalized))) return Number(normalized);
  return normalized;
}
