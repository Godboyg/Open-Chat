import webpush,{ PushSubscription } from "web-push";

// Type-safe env check
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error("VAPID keys are missing in environment variables");
}

webpush.setVapidDetails(
  "mailto:admin@yourapp.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: unknown
): Promise<void> {
  await webpush.sendNotification(
    subscription,
    JSON.stringify(payload)
  );
}