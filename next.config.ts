import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // El árbol tiene varios lockfiles; fijamos la raíz del workspace a este proyecto.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "www.knoplabs.com" }],
  },
};

export default nextConfig;
