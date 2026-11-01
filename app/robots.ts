import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/account/",
          "/checkout/",
          "/bestelling/",
        ],
      },
    ],
    sitemap: "https://www.gentbandenservice.be/sitemap.xml",
    host: "https://www.gentbandenservice.be",
  };
}
