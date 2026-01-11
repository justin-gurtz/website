import type { MetadataRoute } from "next";
import { websiteUrl } from "@/constants";

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
  },
  sitemap: `${websiteUrl}/sitemap.xml`,
});

export default robots;
