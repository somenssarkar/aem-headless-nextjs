import type { NextConfig } from "next";

const EDS_BASE = 'https://main--aem-eds-blog--somenssarkar.aem.live';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles runs before Next.js checks its own app/pages routes,
      // ensuring EDS paths are always proxied regardless of routing state.
      beforeFiles: [
        { source: '/blog',        destination: `${EDS_BASE}/blog/` },
        { source: '/blog/:path*', destination: `${EDS_BASE}/blog/:path*` },
        { source: '/scripts/:path*', destination: `${EDS_BASE}/scripts/:path*` },
        { source: '/styles/:path*',  destination: `${EDS_BASE}/styles/:path*` },
        { source: '/blocks/:path*',  destination: `${EDS_BASE}/blocks/:path*` },
        { source: '/fonts/:path*',   destination: `${EDS_BASE}/fonts/:path*` },
        { source: '/icons/:path*',   destination: `${EDS_BASE}/icons/:path*` },
        { source: '/nav.plain.html',    destination: `${EDS_BASE}/nav.plain.html` },
        { source: '/footer.plain.html', destination: `${EDS_BASE}/footer.plain.html` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
