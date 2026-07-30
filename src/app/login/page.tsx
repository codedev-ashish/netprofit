import AuthPage from "../auth/page";
import { Metadata } from "next";

import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Login";
  let description = "Securely login to your NetProfit dashboard to manage your CA services, check your IPO allotments, and track business compliance.";
  let keywords = undefined;

  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.login;
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

export default function Login() {
  return <AuthPage defaultIsLogin={true} />;
}
