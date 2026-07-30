import { Metadata } from "next";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, limit } from "firebase/firestore";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  let fullTitle = title;
  let desc = "";

  try {
    const q = query(collection(db, "services"), where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      title = snapshot.docs[0].data().name || title;
      desc = snapshot.docs[0].data().excerpt || snapshot.docs[0].data().description || "";
    } else {
      const docSnap = await getDoc(doc(db, "services", slug));
      if (docSnap.exists()) {
        title = docSnap.data().name || title;
        desc = docSnap.data().excerpt || docSnap.data().description || "";
      }
    }
    
    fullTitle = title;
    if (fullTitle.length > 60) {
      fullTitle = fullTitle.substring(0, 57) + "...";
    }

    if (desc) {
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
      desc = `Get expert ${title} services at NetProfit. Our CA team accurately handles your business compliance, registration, and filing.`;
    }
    
    if (desc.length < 110) {
      desc += ` Ensure your business compliance is handled correctly by our expert CA team at NetProfit.`;
    }

    if (desc.length > 155) {
      desc = desc.substring(0, 152).trim() + "...";
    }
  } catch (err) {}

  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  return {
    title: { absolute: decodeTitle(fullTitle) },
    description: desc,
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode, params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <>
      {children}
    </>
  );
}
