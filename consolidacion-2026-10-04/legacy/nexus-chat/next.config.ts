import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Security headers - Cumple con OWASP y Esquema Nacional de Seguridad (ENS)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS - Forzar HTTPS (cumple ENS CCN-STIC 100)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevenir clickjacking (OWASP A05:2021)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevenir MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control de referrer (RGPD - no filtrar datos personales en referrer)
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permisos API del navegador (principio de mínimo privilegio)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
          // Content Security Policy - Previene XSS, clickjacking, inyección (OWASP A03:2021)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https:",
              "media-src 'self' blob: data:",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
          // Cross-Origin Opener Policy - Aislamiento contra Spectre/Meltdown
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          // X-DNS-Prefetch-Control - Privacidad DNS
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
