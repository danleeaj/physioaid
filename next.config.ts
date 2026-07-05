import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

module.exports = {
  allowedDevOrigins: ['192.168.0.5'],
}

export default nextConfig;
