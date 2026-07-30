import { Metadata } from "next";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let title = "Edit News";
  try {
    const slugQuery = query(collection(db, "news"), where("slug", "==", id), limit(1));
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) {
      title = slugSnap.docs[0].data().title || title;
    } else {
      const docSnap = await getDoc(doc(db, "news", id));
      if (docSnap.exists()) {
        title = docSnap.data().title || title;
      }
    }
  } catch (err) {}
  
  let fullTitle = `${title} | NetProfit`;
  if (fullTitle.length > 60) {
    fullTitle = fullTitle.substring(0, 57) + "...";
  }
  
  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  return { 
    title: { absolute: decodeTitle(fullTitle) }
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
