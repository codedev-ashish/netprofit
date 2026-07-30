import { Metadata } from "next";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import pageStyles from "./page.module.css";
import newsStyles from "./news.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let title = "Page Not Found";
  let desc = "";
  let keywords = "";
  let isCustomMeta = false;

  try {
    const pageSnap = await getDoc(doc(db, "pages", slug));
    if (pageSnap.exists() && pageSnap.data().isPublished !== false) {
      const data = pageSnap.data();
      title = data.title || title;
      keywords = data.seoKeywords || "";
      if (data.metaDescription) {
        desc = data.metaDescription;
        isCustomMeta = true;
      } else {
        desc = data.excerpt || data.description || "";
      }
    }
  } catch (err) { }

  let fullTitle = title;
  if (fullTitle.length > 60 && !isCustomMeta) {
    fullTitle = fullTitle.substring(0, 57) + "...";
  }

  if (desc && !isCustomMeta) {
    desc = desc
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  if (!desc) {
    desc = `Review the ${title} at NetProfit. Discover our guidelines, commitments, and the policies governing our professional compliance services in India.`;
  }
  
  if (desc.length < 110 && !isCustomMeta) {
    desc += ` Learn more about our professional compliance services and transparent legal agreements for clients.`;
  }

  if (desc.length > 155 && !isCustomMeta) {
    desc = desc.substring(0, 152).trim() + "...";
  }

  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  const metadata: Metadata = {
    title: { absolute: decodeTitle(fullTitle) },
    description: desc,
    keywords: keywords ? keywords : undefined,
    openGraph: {
      title: decodeTitle(fullTitle),
      description: desc,
      url: `https://netprofit.in/${slug}`,
      type: "website",
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
      title: decodeTitle(fullTitle),
      description: desc,
    }
  };

  if (!metadata.keywords) delete metadata.keywords;
  
  return metadata;
}

export default async function SlugRendererPage({ params }: Props) {
  const { slug } = await params;
  let data: any = null;
  let type: "page" | "news" | null = null;
  let error = false;

  try {
    // 1. Try Custom Page
    const pageRef = doc(db, "pages", slug);
    const pageSnap = await getDoc(pageRef);

    if (pageSnap.exists()) {
      const pageData = pageSnap.data();
      if (pageData.isPublished !== false) {
        data = pageData;
      }
    }

    if (!data) {
      error = true;
    }
  } catch (err) {
    console.error("Error fetching slug data:", err);
    error = true;
  }

  if (error || !data) {
    return (
      <div className={pageStyles.errorContainer}>
        <h1>Page Not Found</h1>
        <p>The page or article you are looking for does not exist or has been removed.</p>
        <Link href="/" className={pageStyles.homeBtn}>Return to Home</Link>
      </div>
    );
  }

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.contentWrapper}>
        <div className={pageStyles.header}>
          <Link href="/" className={pageStyles.backLink}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h1 className={pageStyles.title}>{data.title}</h1>
        </div>

        <div
          className={pageStyles.richText}
          dangerouslySetInnerHTML={{ __html: data.content ? data.content.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>').replace(/http:\/\//gi, 'https://') : '' }}
        />
      </div>
    </div>
  );
}
