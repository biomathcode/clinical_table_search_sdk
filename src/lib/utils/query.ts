import type { CsvParam, EfParam, EfSpec, QueryPrimitive } from "../types";

export function normalizeBaseUrl(baseUrl: string): string {
  // Keep it simple and predictable for URL(base, path) resolution.
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function setQueryParam(
  url: URL,
  key: string,
  value: QueryPrimitive | undefined,
): void {
  if (value === undefined) return;
  url.searchParams.set(key, String(value));
}

export function setCsvQueryParam<T extends string>(
  url: URL,
  key: string,
  value: CsvParam<T> | undefined,
): void {
  if (value === undefined) return;
  if (Array.isArray(value)) {
    url.searchParams.set(key, value.join(","));
    return;
  }
  url.searchParams.set(key, String(value));
}

export function efToCsv<Field extends string>(
  ef: EfParam<Field> | undefined,
): string | undefined {
  if (ef === undefined) return undefined;
  if (typeof ef === "string") return ef;
  const parts: string[] = [];
  for (const item of ef) {
    if (typeof item === "string") {
      parts.push(item);
      continue;
    }
    parts.push(`${item.field}:${item.as}`);
  }
  return parts.join(",");
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function shallowCloneRecord<T extends Record<string, unknown>>(r: T): T {
  return { ...r };
}

export function isEfSpec<Field extends string>(
  value: unknown,
): value is EfSpec<Field> {
  return (
    typeof value === "string" ||
    (isObject(value) &&
      typeof value.field === "string" &&
      typeof value.as === "string")
  );
}
