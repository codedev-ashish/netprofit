"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Optional: Avoid tracking admin routes if desired, but we track all for now.
    // if (pathname.startsWith('/admin')) return;

    const trackView = async () => {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer
          }),
        });
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    };

    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => trackView());
      } else {
        trackView();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null; // This component doesn't render anything
}
