import AuthComponent from "../../components/AuthComponent";
import { Metadata } from "next";

import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Register";
  let description = "Create your free NetProfit account. Access a complete suite of professional CA services, track business compliances, and seamlessly interact with our expert team.";
  let keywords = undefined;

  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.register;
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

export default function Register() {
  return <AuthComponent defaultIsLogin={false} />;
}
