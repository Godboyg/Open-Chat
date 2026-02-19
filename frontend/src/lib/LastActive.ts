
export function formatLastActive(lastActiveISO: string) {
  const lastActive = new Date(lastActiveISO);
  const now = new Date();

  const diffMs = now.getTime() - lastActive.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  // const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just gone";

  if (diffMins < 60)
    return `last active ${diffMins} min${diffMins > 1 ? "s" : ""} ago`;

  const lastActiveIST = lastActive.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isToday =
    lastActive.toDateString() === now.toDateString();

  if (isToday)
    return `last active today at ${lastActiveIST}`;

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (lastActive.toDateString() === yesterday.toDateString())
    return `last active yesterday at ${lastActiveIST}`;

  const date = lastActive.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  });

  return `last active ${date} at ${lastActiveIST}`;
}