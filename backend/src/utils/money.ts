export function moneyToString(value: number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toFixed(2);
}
