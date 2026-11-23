// Never cache private account data or API responses.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || "StayNest update", {
      body: data.body || "Open StayNest for your hostel updates.",
      icon: "/icon-192.png",
      tag: data.tag || "staynest",
      data: { url: "/" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const w of windows)
          if (new URL(w.url).origin === self.location.origin) return w.focus();
        return self.clients.openWindow("/");
      }),
  );
});
