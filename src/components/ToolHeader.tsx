"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import styles from "./ToolHeader.module.css";
import ShareButtons from "./ShareButtons";

export default function ToolHeader({ toolSlug }: { toolSlug: string }) {
  const [title, setTitle] = useState("Loading...");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    const fetchToolData = async () => {
      try {
        const q = query(collection(db, "tools"), where("slug", "==", toolSlug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setTitle(data.pageTitle || data.name || "Tool Calculator");
          setSubtitle(data.pageSubtitle || data.description || "");
        } else {
          setTitle("Tool Not Found");
        }
      } catch (err) {
        console.error("Failed to fetch tool data", err);
        setTitle("Calculator");
      }
    };
    fetchToolData();
  }, [toolSlug]);

  return (
    <div className={styles.hero}>
      <div className={styles.title} style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{title}</div>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <ShareButtons title={title} text={subtitle} />
      </div>
    </div>
  );
}
