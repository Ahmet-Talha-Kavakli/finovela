import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gemini ürettiğimiz PNG'ler net kalsın — optimizasyon donuklaştırıyordu
    unoptimized: true,
  },
};

export default nextConfig;
