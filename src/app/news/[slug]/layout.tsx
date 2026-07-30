import { Metadata } from "next";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let title = "News";
  let desc = "";
  try {
    const slugQuery = query(collection(db, "news"), where("slug", "==", slug), limit(1));
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) {
      title = slugSnap.docs[0].data().title || title;
      desc = slugSnap.docs[0].data().excerpt || slugSnap.docs[0].data().description || "";
    } else {
      const docSnap = await getDoc(doc(db, "news", slug));
      if (docSnap.exists()) {
        title = docSnap.data().title || title;
        desc = docSnap.data().excerpt || docSnap.data().description || "";
      }
    }
  } catch (err) {}
  
  const decodeEntities = (str: string | number) => {
    if (!str) return String(str);
    return String(str)
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '”')
      .replace(/&#39;/gi, '’')
      .replace(/&#039;/gi, '’')
      .replace(/&#x27;/gi, '’')
      .replace(/'/g, '’')
      .replace(/"/g, '”')
      .replace(/&nbsp;/gi, ' ');
  };

  title = decodeEntities(title);

  let fullTitle = title;
  if (fullTitle.length > 60) {
    fullTitle = fullTitle.substring(0, 57) + "...";
  }
  
  if (desc) {
    desc = decodeEntities(desc)
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  if (!desc) {
    desc = `Read the latest news about ${title}. Stay informed with expert insights on taxation, GST, and business regulations in India.`;
  }
  
  if (desc.length < 110) {
    desc += ` Stay up-to-date with essential financial news and comprehensive policy updates from NetProfit.`;
  }

  if (desc.length > 155) {
    desc = desc.substring(0, 152).trim() + "...";
  }
  
  
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  return { 
    title: { absolute: decodeTitle(fullTitle) },
    description: desc
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode, params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let title = "News";
  try {
    const slugQuery = query(collection(db, "news"), where("slug", "==", slug), limit(1));
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) {
      title = slugSnap.docs[0].data().title || title;
    } else {
      const docSnap = await getDoc(doc(db, "news", slug));
      if (docSnap.exists()) {
        title = docSnap.data().title || title;
      }
    }
  } catch (err) {}

  return (
    <>
      {children}
    </>
  );
}
