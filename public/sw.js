// Service worker mínimo — existe só para o Chrome/Android considerar o site
// "instalável" (um dos critérios é ter um service worker com handler de fetch).
//
// Não faz cache de nada: sem chamar event.respondWith(), o navegador trata
// cada requisição normalmente, como se este arquivo nem existisse. Isso é
// proposital — o app mostra dado de estoque/financeiro que precisa estar
// sempre atualizado, então não queremos nenhum comportamento de cache aqui.
self.addEventListener("fetch", () => {})
