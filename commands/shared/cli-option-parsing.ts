export function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

export function intOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

export function boolToOverride(
  value: unknown,
  enabledValue: boolean,
): boolean | null {
  return value === true ? enabledValue : null;
}

export function csvToArrayOrNull(value: unknown): string[] | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
