import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["psychic-carnival-5g5rqvpxxv6434qr-3000.app.github.dev", "localhost:3000"],
    },

}};

export default nextConfig;
