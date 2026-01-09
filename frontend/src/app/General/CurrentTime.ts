export function getCurrentTime() {
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes();

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; 

  const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
  return formattedTime;
}
