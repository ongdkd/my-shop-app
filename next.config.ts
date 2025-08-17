import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.postimg.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.imgbb.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "imgbb.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "postimg.cc",
        port: "",
        pathname: "/**",
      },
    ],
  },
  
  // ESLint configuration for production builds
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
