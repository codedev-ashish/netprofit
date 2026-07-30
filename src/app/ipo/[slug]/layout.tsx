import { Metadata } from "next";
import { collection, query, where, getDocs, doc, getDoc, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let title = "IPO Details";
  let desc = "";
  try {
    const q = query(collection(db, "ipos"), where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      title = snapshot.docs[0].data().name;
      desc = snapshot.docs[0].data().excerpt || snapshot.docs[0].data().description || "";
    } else {
      const docSnap = await getDoc(doc(db, "ipos", slug));
      if (docSnap.exists()) {
        title = docSnap.data().name;
        desc = docSnap.data().excerpt || docSnap.data().description || "";
      }
    }
  } catch (err) {}
  
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
    desc = `Get detailed IPO information, subscription status, and expert review for ${title} at NetProfit.`;
  }
  
  if (desc.length < 110) {
    desc += ` Stay informed with the latest updates and expert insights to make the best investment decisions.`;
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
  let title = "IPO Details";
  try {
    const q = query(collection(db, "ipos"), where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      title = snapshot.docs[0].data().name;
    } else {
      const docSnap = await getDoc(doc(db, "ipos", slug));
      if (docSnap.exists()) {
        title = docSnap.data().name;
      }
    }
  } catch (err) {}

  return (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h1>{title}</h1>
      </div>
      {children}
    </>
  );
}
