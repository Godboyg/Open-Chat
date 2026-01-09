
export function formatMessageDateHeader(messageISO?: Date | number | string) {
  if(!messageISO) return;
  
  const date = new Date(messageISO);
  const now = new Date();

  if (date.toDateString() === now.toDateString())
    return "Today";

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString())
    return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}