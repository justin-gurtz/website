import type { MetadataRoute } from "next";
import { websiteUrl } from "@/constants";

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: websiteUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
];

export default sitemap;
