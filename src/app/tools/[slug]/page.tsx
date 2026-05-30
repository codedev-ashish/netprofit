"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import styles from "../../page.module.css";
import Link from "next/link";
import LoanCalculator from "../../../components/calculators/LoanCalculator";
import ToolHeader from "../../../components/ToolHeader";
import DisclaimerCard from "../../../components/DisclaimerCard";

export default function ToolDynamicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [toolName, setToolName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoanCalculator = ['car-loan-calculator', 'home-loan-calculator', 'personal-loan-calculator', 'term-loan-calculator'].includes(slug);

  useEffect(() => {
    const fetchToolData = async () => {
      if (!slug) return;
      try {
        const q = query(collection(db, "tools"), where("slug", "==", slug), where("isPublished", "==", true));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setToolName(snapshot.docs[0].data().name);
        } else {
          // Tool not found or not published
          router.push("/tools");
        }
      } catch (error) {
        console.error("Error fetching tool:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchToolData();
  }, [slug, router]);

  if (loading) {
    return (
      <div className={styles.container} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading calculator...</p>
      </div>
    );
  }

  if (isLoanCalculator) {
    let defaults = { amount: 500000, rate: 9, tenure: 5 };
    if (slug === 'home-loan-calculator') defaults = { amount: 5000000, rate: 8.5, tenure: 20 };
    if (slug === 'personal-loan-calculator') defaults = { amount: 300000, rate: 12, tenure: 3 };
    if (slug === 'term-loan-calculator') defaults = { amount: 1000000, rate: 10, tenure: 5 };
    
    return (
      <>
        <ToolHeader toolSlug={slug} />
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            <LoanCalculator title={toolName || "Loan Calculator"} defaultAmount={defaults.amount} defaultRate={defaults.rate} defaultTenure={defaults.tenure} />
            <DisclaimerCard toolSlug={slug} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>{toolName || "Calculator"}</h1>
        <p className={styles.subtitle}>This tool is currently under development.</p>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.calculatorWrapper} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-color)' }}>Coming Soon</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px' }}>
            We are working hard to build the <strong>{toolName}</strong>. 
            Please check back later or explore our other available calculators.
          </p>
          <Link href="/tools" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
