import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
    : [],
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // Explicitly grant our own origin the sensors the guided tests
            // use, and keep embedded third-party contexts locked out.
            key: "Permissions-Policy",
            value:
              "camera=(self), accelerometer=(self), gyroscope=(self), geolocation=(), microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
