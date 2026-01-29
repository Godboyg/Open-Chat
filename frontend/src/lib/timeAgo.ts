export function timeAgo(isoTime?: string | Date): string {
  if (!isoTime) return "";
  const now: Date = new Date();
  const past: Date = typeof isoTime === "string"
    ? new Date(isoTime)
    : isoTime;

  const diffMs: number = now.getTime() - past.getTime();
  const diffSec: number = Math.floor(diffMs / 1000);
  const diffMin: number = Math.floor(diffSec / 60);
  const diffHour: number = Math.floor(diffMin / 60);
  const diffDay: number = Math.floor(diffHour / 24);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec} sec ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return past.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}