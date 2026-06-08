import type { MetadataRoute } from "next";
import { ALL_SERVICES } from "./services-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.atozworks.co";

  // Static routes
  const routes = [
    "",
    "/bookings",
    "/partner/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic service routes
  const serviceRoutes = ALL_SERVICES.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...routes, ...serviceRoutes];
}
