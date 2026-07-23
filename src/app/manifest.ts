import type { MetadataRoute } from "next"

// Convenção do Next.js (App Router): este arquivo é servido automaticamente em /manifest.webmanifest.
// Sem manifest, o navegador tenta "adivinhar" o ícone ao instalar como app (PC/celular) e o resultado
// fica desproporcional — por isso os ícones abaixo já vêm com margem de segurança, pensados pra
// máscara circular do Android e cantos arredondados do iOS/Windows.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UniControl",
    short_name: "UniControl",
    description: "Sistema de controle interno",
    start_url: "/",
    display: "standalone",
    background_color: "#2B3D4F",
    theme_color: "#2B3D4F",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
