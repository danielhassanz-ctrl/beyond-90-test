export function formatGroupedInteger(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
