import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be reached from other devices on the local
  // network (e.g. http://192.168.0.104:3000) during development.
  allowedDevOrigins: ["192.168.0.104"],
};

export default nextConfig;
