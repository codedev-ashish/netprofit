import { Metadata } from "next";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let title = "Tool";
  let desc = "";
  try {
    const q = query(collection(db, "tools"), where("slug", "==", slug), where("isPublished", "==", true), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      title = snapshot.docs[0].data().name || title;
      desc = snapshot.docs[0].data().excerpt || snapshot.docs[0].data().description || "";
    }
  } catch (err) { }
  
  let fullTitle = title;
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
    desc = `Use our free ${title} to quickly and accurately calculate your financial and business metrics. Expert tools by NetProfit.`;
  }
  
  if (desc.length < 110) {
    desc += ` Simplify your tax planning and financial calculations easily with our accurate online utilities.`;
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
  let title = "Tool";
  try {
    const q = query(collection(db, "tools"), where("slug", "==", slug), where("isPublished", "==", true), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      title = snapshot.docs[0].data().name || title;
    }
  } catch (err) { }

  return (
    <>
      
      {children}
    </>
  );
}
