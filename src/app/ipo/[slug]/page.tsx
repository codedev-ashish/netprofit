import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import IPODetailsClient from "./IPODetailsClient";
import BreadcrumbSchema from "../../../components/BreadcrumbSchema";

export const revalidate = 3600;

import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = "IPO Details";
  let description = "";
  let keywords = "";

  let isCustomMeta = false;

  try {
    const q = query(collection(db, "ipos"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      title = data.metaTitle || data.name || title;
      keywords = data.seoKeywords || "";
      if (data.metaDescription) {
        description = data.metaDescription;
        isCustomMeta = true;
      } else {
        description = data.description || "";
      }
    } else {
      const docRef = doc(db, "ipos", slug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        title = data.metaTitle || data.name || title;
        keywords = data.seoKeywords || "";
        if (data.metaDescription) {
          description = data.metaDescription;
          isCustomMeta = true;
        } else {
          description = data.description || "";
        }
      }
    }
  } catch (error) {
    console.error("Error generating metadata for IPO:", error);
  }

  if (description && !isCustomMeta) {
    description = description.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').substring(0, 160);
  }

  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  const metadata: Metadata = {
    title: { absolute: decodeTitle(title) },
    description: description,
    keywords: keywords ? keywords : undefined,
    openGraph: {
      title: decodeTitle(title),
      description: description,
      url: `https://netprofit.in/ipo/${slug}`,
      type: "article",
      siteName: "NetProfit",
      images: [
        {
          url: "https://netprofit.in/icon.svg",
          width: 512,
          height: 512,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: decodeTitle(title),
      description: description,
    }
  };

  if (!metadata.keywords) delete metadata.keywords;

  return metadata;
}

function deepSerialize(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSerialize);
  }
  const serialized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      serialized[key] = deepSerialize(obj[key]);
    }
  }
  return serialized;
}

export default async function IPODetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let ipoData: any = null;

  try {
    const q = query(collection(db, "ipos"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      ipoData = { id: docSnap.id, ...docSnap.data() };
    } else {
      // Fallback to fetch by ID
      const docRef = doc(db, "ipos", slug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        ipoData = { id: docSnap.id, ...docSnap.data() };
      }
    }

    if (ipoData) {
      ipoData = deepSerialize(ipoData);
    }
  } catch (error) {
    console.error("Error fetching IPO details on server:", error);
  }

  const openDateStr = ipoData?.timelineFields?.find((f: any) => f.id === 'openDate')?.value || ipoData?.timeline?.openDate || ipoData?.openDate;
  const closeDateStr = ipoData?.timelineFields?.find((f: any) => f.id === 'closeDate')?.value || ipoData?.timeline?.closeDate || ipoData?.closeDate;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": ipoData?.name || "IPO",
    "description": ipoData?.metaDescription || ipoData?.description || "IPO details",
    "category": "Initial Public Offering",
    "provider": {
      "@type": "Organization",
      "name": ipoData?.name || "Issuing Company"
    }
  };

  let eventJsonLd = null;
  try {
    if (openDateStr && closeDateStr && !isNaN(new Date(openDateStr).getTime()) && !isNaN(new Date(closeDateStr).getTime())) {
      eventJsonLd = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": `${ipoData?.name || "IPO"} Subscription Window`,
        "startDate": new Date(openDateStr).toISOString(),
        "endDate": new Date(closeDateStr).toISOString(),
        "eventStatus": "https://schema.org/EventScheduled"
      };
    }
  } catch (e) {}

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "IPO Watch", url: "/ipo" },
        { name: ipoData?.name || "IPO Details", url: `/ipo/${slug}` }
      ]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {eventJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />}
      {ipoData?.customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ipoData.customSchema }} />
      )}
      <IPODetailsClient initialData={ipoData} />
    </>
  );
}
