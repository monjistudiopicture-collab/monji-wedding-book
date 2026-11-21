import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MONJI WEDDING BOOK",
    short_name: "MONJI BOOK",
    description: "Ứng dụng quản lý lịch cưới và khách hàng MONJI Studio",
    start_url: "/protected",
    scope: "/",
    display: "standalone",
    background_color: "#F8F5F0",
    theme_color: "#F3EDE3",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
