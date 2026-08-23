import type { MetadataRoute } from "next";

const BASE_URL = "https://mc-qure.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: "daily" | "weekly" | "monthly";
  }> = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/practice", priority: 0.9, changeFrequency: "weekly" },
    { path: "/mock", priority: 0.9, changeFrequency: "weekly" },
    { path: "/study", priority: 0.8, changeFrequency: "daily" },
    { path: "/questions", priority: 0.8, changeFrequency: "daily" },
    { path: "/pyq", priority: 0.8, changeFrequency: "daily" },
    { path: "/preparation", priority: 0.7, changeFrequency: "weekly" },
    { path: "/analytics", priority: 0.6, changeFrequency: "weekly" },
    { path: "/motivation", priority: 0.6, changeFrequency: "weekly" },
    { path: "/reports", priority: 0.5, changeFrequency: "monthly" },
    { path: "/register", priority: 0.5, changeFrequency: "monthly" },
    { path: "/login", priority: 0.3, changeFrequency: "monthly" },
  ];

  return routes.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
