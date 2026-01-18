export function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }

  return buffer; // ✅ ArrayBuffer ONLY
}

export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;

  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
  });
}