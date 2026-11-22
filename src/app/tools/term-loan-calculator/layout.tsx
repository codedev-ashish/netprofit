import { Metadata } from "next";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  let title = "Tool";
  try {
    const q = query(collection(db, "tools"), where("slug", "==", "term-loan-calculator"), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      title = snapshot.docs[0].data().name || title;
    }
  } catch (err) {}
  return { title: { absolute: `${title} | Free Financial Calculators | NetProfit` } };
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  let title = "Tool";
  try {
    const q = query(collection(db, "tools"), where("slug", "==", "term-loan-calculator"), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      title = snapshot.docs[0].data().name || title;
    }
  } catch (err) {}

  return (
    <>
      
      {children}
    </>
  );
}
