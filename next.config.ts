import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las fuentes de la imagen de vista previa (lib/og.tsx) se leen del disco
  outputFileTracingIncludes: {
    '/**': ['./assets/fonts/**/*'],
  },
};

export default nextConfig;
