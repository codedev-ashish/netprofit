"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ServiceRedirectorPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const serviceName = params?.serviceName as string;

  useEffect(() => {
    if (businessId && serviceName) {
      // Default to 2025-26 tax year
      router.replace(`/dashboard/businesses/${businessId}/${serviceName}/2025-26`);
    }
  }, [businessId, serviceName, router]);

  return <div style={{ padding: '2rem' }}>Redirecting to filing dashboard...</div>;
}
