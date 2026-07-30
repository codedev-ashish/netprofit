"use client";

import { usePathname } from "next/navigation";

export default function CanonicalTag() {
  const pathname = usePathname();
  let normalizedPath = pathname;
  
  if (normalizedPath.endsWith("/") && normalizedPath !== "/") {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  if (normalizedPath === "/" || normalizedPath === "/index" || normalizedPath === "/index.html") {
    normalizedPath = "";
  }

  // SEO: Prevent duplicate content by pointing user service pages to public service pages
  if (normalizedPath.startsWith('/user/services/')) {
    normalizedPath = normalizedPath.replace('/user/services/', '/services/');
  }

  const canonicalUrl = `https://netprofit.in${normalizedPath}`;

  return (
    <>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
    </>
  );
}
