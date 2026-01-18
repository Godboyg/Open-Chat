
declare const self: ServiceWorkerGlobalScope;

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener("push", (event: PushEvent) => {
  const data: PushPayload = event.data
    ? (event.data.json() as PushPayload)
    : {};

  const title: string = data.title ?? "New Message";

  const options: NotificationOptions = {
    body: data.body ?? "You received a new message",
    icon: "/next.svg",
    badge: "/next.svg",
    data: {
      url: data.url ?? "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url: string =
    (event.notification.data as { url?: string })?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.includes(url) &&
            "focus" in client
          ) {
            return (client as WindowClient).focus();
          }
        }

        return self.clients.openWindow(url);
      })
  );
});
