import { Metadata } from "next";
import { db } from "../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import CategoryNewsClient from "./CategoryNewsClient";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  
  let title = `${decodedCategory} News | NetProfit`;
  let description = `Latest updates and articles in ${decodedCategory}.`;
  let keywords = undefined;

  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.newsCategory;
      if (data) {
        if (data.title) title = data.title.replace(/{category}/g, decodedCategory);
        if (data.description) description = data.description.replace(/{category}/g, decodedCategory);
        if (data.keywords) keywords = data.keywords.replace(/{category}/g, decodedCategory);
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

export default function CategoryNewsPage() {
  return <CategoryNewsClient />;
}
