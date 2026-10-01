import type { NextConfig } from "next";

import { IMAGE_HOSTS } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  // Recomendação do guia Mastra + Next.js: não empacotar o Mastra no bundle do servidor
  serverExternalPackages: ["@mastra/*"],
  images: {
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
