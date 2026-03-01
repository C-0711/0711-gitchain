import { MetadataRoute } from "next";

const baseUrl = "https://gitchain.0711.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/pricing",
    "/docs",
    "/api-reference",
    "/contact",
    "/about",
    "/privacy",
    "/terms",
    "/security",
    "/changelog",
  ];

  const routes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1 : route === "/pricing" ? 0.9 : 0.8,
  }));

  return routes;
}
