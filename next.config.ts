import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** Public URL → internal `app/{product}/...` path. Folders are `web`, `advisory`, `track` (not route groups). */
function mapToProduct(prefix: string, publicPaths: string[]) {
  return publicPaths.flatMap((publicPath) => [
    { source: publicPath, destination: `${prefix}${publicPath}` },
    { source: `${publicPath}/:path*`, destination: `${prefix}${publicPath}/:path*` },
  ])
}

const nextConfig: NextConfig = {
  // Tenant subdomains in local dev (e.g. acme.localhost:3000)
  allowedDevOrigins: ["*.localhost"],
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon" },
      // `/advisory` is the marketing page in `app/web/advisory`. Do not use
      // `/advisory/:path*` — that would steal `app/advisory/dashboard` etc.
      { source: "/advisory", destination: "/web/advisory" },
      { source: "/advisory/opengraph-image", destination: "/web/advisory/opengraph-image" },
      { source: "/advisory/opengraph-image/:path*", destination: "/web/advisory/opengraph-image/:path*" },
      ...mapToProduct("/web", ["/insights", "/membership", "/home"]),
      ...mapToProduct("/advisory", [
        "/dashboard",
        "/admin",
        "/admin-select",
        "/subscribe",
        "/waiting",
        "/wait-approval",
        "/tips",
        "/broadcast",
        "/invite",
        "/inquiries",
        "/organization-not-found",
        "/api/dashboard",
        "/api/admin",
        "/api/broadcast-feedback",
        "/api/trade-usage",
        "/api/market",
      ]),
      ...mapToProduct("/track", ["/app"]),
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
