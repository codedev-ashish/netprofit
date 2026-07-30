import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import ToolDetailsClient from "./ToolDetailsClient";
import BreadcrumbSchema from "../../../components/BreadcrumbSchema";

export const revalidate = 3600;

import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = "Tool";
  let description = "";

  let isCustomMeta = false;

  try {
    const q = query(collection(db, "tools"), where("slug", "==", slug), where("isPublished", "==", true));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      title = data.metaTitle || data.name || title;
      if (data.metaDescription) {
        description = data.metaDescription;
        isCustomMeta = true;
      } else {
        description = data.description || "";
      }
    }
  } catch (error) {
    console.error("Error generating metadata for tool:", error);
  }

  if (description && !isCustomMeta) {
    description = description.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').substring(0, 160);
  }

  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  return {
    title: { absolute: decodeTitle(title) },
    description: description,
    openGraph: {
      title: decodeTitle(title),
      description: description,
      url: `https://netprofit.in/tools/${slug}`,
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
}

export default async function ToolDynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let toolData: any = null;
  let toolName: string | null = null;

  try {
    const q = query(collection(db, "tools"), where("slug", "==", slug), where("isPublished", "==", true));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      toolData = snapshot.docs[0].data();
      toolName = toolData.name;
    }
  } catch (error) {
    console.error("Error fetching tool on server:", error);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": toolData?.name || "Financial Tool",
    "description": toolData?.metaDescription || toolData?.description || "Online financial calculator",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "browserRequirements": "Requires JavaScript"
  };

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Tools", url: "/tools" },
        { name: toolData?.name || "Tool", url: `/tools/${slug}` }
      ]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {toolData?.customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toolData.customSchema }} />
      )}
      <ToolDetailsClient initialToolName={toolName} slug={slug} />
    </>
  );
}
