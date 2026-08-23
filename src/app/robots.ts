import type { MetadataRoute } from "next";

const BASE_URL = "https://mc-qure.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/practice/session"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
