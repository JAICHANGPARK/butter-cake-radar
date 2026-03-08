import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { repository } from "@/lib/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stores = await repository.listStores({});

  return [
    {
      url: env.siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...stores.map((store) => ({
      url: `${env.siteUrl}/stores/${store.id}`,
      lastModified: new Date(store.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
