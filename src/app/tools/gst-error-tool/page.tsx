import GstErrorToolClient from "./GstErrorToolClient";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  let title = "GST Error tool";
  try {
    const q = query(collection(db, "tools"), where("slug", "==", "gst-error-tool"), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      title = snapshot.docs[0].data().name || title;
    }
  } catch (err) { }
  return { title: { absolute: `${title} | Free Financial Calculators | NetProfit` } };
}

export default async function GstErrorToolPage() {
  let title = "GST Error Tool";

  try {
    const q = query(collection(db, "tools"), where("slug", "==", "gst-error-tool"), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      title = data.name || title;
    }
  } catch (err) {
    console.error("Failed to fetch gst-error-tool data:", err);
  }

  return (
    <>

      <GstErrorToolClient initialTitle={title} />
    </>
  );
}
