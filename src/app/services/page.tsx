import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import ServicesList from "../../components/ServicesList";
import { Metadata } from "next";
import BreadcrumbSchema from "../../components/BreadcrumbSchema";

import { doc, getDoc } from "firebase/firestore";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Professional Services | Accounting | Tax Filings | NetProfit";
  let description = "Simplify your business finances. Explore our expert compliance services, including Income Tax, GST filing, TDS, and accounting solutions. Streamline your growth today.";
  let keywords = undefined;

  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.services;
      if (data) {
        if (data.title) title = data.title;
        if (data.description) description = data.description;
        if (data.keywords) keywords = data.keywords;
      }
    }
  } catch (e) {}

  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  return {
    title: { absolute: decodeTitle(title) },
    description,
    ...(keywords && { keywords }),
    openGraph: { title, description },
    twitter: { title, description }
  };
}

export const revalidate = 3600;

export default async function PublicServicesPage() {
  let customSchema = undefined;
  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const seoData = docSnap.data()?.services;
      if (seoData?.customSchema) customSchema = seoData.customSchema;
    }
  } catch (e) {}

  let services: any[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, "services"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isPublished !== false) {
        let serializedData = { ...data };
        if (serializedData.createdAt && typeof serializedData.createdAt.toDate === 'function') {
          serializedData.createdAt = serializedData.createdAt.toDate().toISOString();
        } else if (serializedData.createdAt && serializedData.createdAt.seconds) {
          serializedData.createdAt = new Date(serializedData.createdAt.seconds * 1000).toISOString();
        }
        services.push({ id: doc.id, ...serializedData });
      }
    });
  } catch (error) {
    console.error("Error fetching services:", error);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Professional Services",
    "url": "https://netprofit.in/services",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": services.map((service, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://netprofit.in/services/${service.slug || service.id}`
      }))
    }
  };

  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: customSchema }} />
      )}
      <ServicesList initialServices={services} />
    </>
  );
}
