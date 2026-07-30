import ServiceDetails from "../../../components/ServiceDetails";
import { Metadata } from "next";
import BreadcrumbSchema from "../../../components/BreadcrumbSchema";

export const revalidate = 3600;
export const dynamicParams = true;



import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  let serviceData: any = null;

  try {
    const q = query(collection(db, "services"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      serviceData = querySnapshot.docs[0].data();
    } else {
      const fallbackRef = doc(db, "services", slug);
      const docSnap = await getDoc(fallbackRef);
      if (docSnap.exists()) {
        serviceData = docSnap.data();
      }
    }
  } catch (error) {
    console.error("Error fetching service metadata:", error);
  }

  const title = serviceData?.metaTitle || `${serviceData?.name || decodedSlug} | NetProfit`;
  const description = serviceData?.metaDescription || `Expert CA assistance for ${serviceData?.name || decodedSlug}. Simplify your business compliance with our platform.`;
  const keywords = serviceData?.seoKeywords || `${decodedSlug}, Business Registration, NetProfit`;

  return {
    title: { absolute: title },
    description: description,
    keywords: keywords,
    openGraph: {
      title: title,
      description: description,
      url: `https://netprofit.in/services/${slug}`,
      type: "article",
      siteName: "NetProfit",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    }
  };
}

export default async function PublicServiceDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let serviceData: any = null;

  try {
    const q = query(collection(db, "services"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      serviceData = querySnapshot.docs[0].data();
    } else {
      const fallbackRef = doc(db, "services", slug);
      const docSnap = await getDoc(fallbackRef);
      if (docSnap.exists()) {
        serviceData = docSnap.data();
      }
    }
  } catch (error) {
    console.error("Error fetching service data for JSON-LD:", error);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceData?.name || "Professional Service",
    "serviceType": serviceData?.name || "Professional Service",
    "provider": {
      "@type": "Organization",
      "name": "NetProfit",
      "url": "https://netprofit.in"
    },
    "areaServed": "IN",
    "offers": {
      "@type": "Offer",
      "price": serviceData?.plans?.[0]?.price?.toString() || "0",
      "priceCurrency": "INR"
    }
  };

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Services", url: "/services" },
        { name: serviceData?.name || "Service", url: `/services/${slug}` }
      ]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {serviceData?.customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serviceData.customSchema }} />
      )}
      <ServiceDetails initialService={null} initialComboDetails={[]} />
    </>
  );
}

