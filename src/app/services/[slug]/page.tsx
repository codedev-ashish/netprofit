"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useParams } from "next/navigation";
import ServiceDetails from "../../../components/ServiceDetails";

export default function PublicServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && params?.slug) {
        router.push(`/user/services/${params.slug}`);
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router, params]);

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}>Loading service details...</p>
      </div>
    );
  }

  return <ServiceDetails />;
}
