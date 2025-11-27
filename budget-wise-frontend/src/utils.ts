export function formatDate(dateStr: string) {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
