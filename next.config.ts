import type { NextConfig } from "next";
import { networkInterfaces } from "os";

// Collect every LAN IPv4 address this machine currently holds so phones and
// other devices can reach the dev server no matter how DHCP reshuffles IPs
// (a static entry here went stale when 192.168.0.104 became .102).
const lanOrigins = [
  ...new Set(
    Object.values(networkInterfaces())
      .flat()
      .filter((n) => n && n.family === "IPv4" && !n.internal)
      .map((n) => n!.address),
  ),
];

const nextConfig: NextConfig = {
  // Allow the dev server to be reached from other devices on the local
  // network during development.
  allowedDevOrigins: lanOrigins,
  // Do not advertise the framework via the X-Powered-By response header.
  poweredByHeader: false,
};

export default nextConfig;
