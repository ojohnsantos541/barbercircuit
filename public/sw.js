self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() ?? "" }; }
  const title = payload.title || "BarberCircuit";
  const options = {
    body: payload.body || "Você tem uma atualização na agenda.",
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
    data: { url: payload.url || "/painel/agendamentos" },
    tag: payload.tag || "barbercircuit-update",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/painel/agendamentos", self.location.origin).href;
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientsList) {
      if ("focus" in client) {
        await client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
