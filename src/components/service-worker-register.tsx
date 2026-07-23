"use client"

import { useEffect } from "react"

// Registra o service worker mínimo (public/sw.js), necessário pro Chrome/Android
// oferecer a opção de instalar o app. Ele não faz cache de nada — ver comentário
// em public/sw.js. Falha de registro é ignorada silenciosamente: não afeta o
// funcionamento do app, só a possibilidade de instalar como PWA.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])

  return null
}
