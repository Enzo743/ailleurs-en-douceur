import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  sassOptions: {
    loadPaths: ["./src/styles"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  allowedDevOrigins: ['192.168.1.36'],
  // Configuration pour l'Image Optimizer
  images: {
    // Désactiver l'optimisation en production car les images uploadées
    // sont dans /var/www/uploads/ qui n'est pas accessible par l'Image Optimizer
    // En développement, les images sont dans public/uploads/ donc accessibles
    unoptimized: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
