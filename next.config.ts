import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  sassOptions: {
    loadPaths: ["./src/styles"],
  },
};

export default nextConfig;
